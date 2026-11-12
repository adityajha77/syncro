import { Router } from 'express';
import { z } from 'zod';
import { Role, Workspace } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, parse, HttpError } from '../lib/http.js';
import { publicUserSelect } from '../lib/auth.js';
import { generateInviteCode, normalizeInviteCode } from '../lib/crypto.js';
import { requireAuth, requireMember } from '../middleware/auth.js';
import { recordActivity, activityInclude } from '../services/activity.service.js';
import { wsManager } from '../lib/websocket.js';
import { tasksRouter } from './tasks.routes.js';
import { commitsRouter } from './commits.routes.js';
import { eventsRouter } from './events.routes.js';
import { telemetryRouter } from './telemetry.routes.js';

export const workspacesRouter = Router();
workspacesRouter.use(requireAuth);

function slugify(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) || 'workspace';
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Retries on the (very unlikely) unique collision. */
async function withUniqueInviteCode<T>(fn: (code: string) => Promise<T>): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn(generateInviteCode());
    } catch (err) {
      const isCollision = (err as { code?: string }).code === 'P2002';
      if (!isCollision || i >= 4) throw err;
    }
  }
}

/** Workspaces created before invite codes existed get one on first read. */
async function ensureInviteCode(ws: Workspace): Promise<Workspace> {
  if (ws.inviteCode) return ws;
  return withUniqueInviteCode((inviteCode) => prisma.workspace.update({ where: { id: ws.id }, data: { inviteCode } }));
}

/** API shape of a workspace. Viewers can't see (and so can't share) the invite code. */
export async function serializeWorkspace(ws: Workspace, role: Role) {
  const withCode = await ensureInviteCode(ws);
  const memberCount = await prisma.workspaceMember.count({ where: { workspaceId: ws.id } });
  return { ...withCode, inviteCode: role === 'VIEWER' ? null : withCode.inviteCode, role, memberCount };
}

export async function listWorkspacesForUser(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: { workspace: true },
    orderBy: { joinedAt: 'asc' },
  });
  return Promise.all(memberships.map((m) => serializeWorkspace(m.workspace, m.role)));
}

/** Creates a workspace owned by `userId` and logs it in the ledger. */
export async function createWorkspaceForUser(userId: string, name: string) {
  const workspace = await withUniqueInviteCode((inviteCode) =>
    prisma.workspace.create({
      data: { name, slug: slugify(name), inviteCode, members: { create: { userId, role: 'OWNER' } } },
    })
  );
  await recordActivity({
    workspaceId: workspace.id,
    actorId: userId,
    type: 'WORKSPACE_CREATED',
    summary: `created workspace "${name}"`,
    entityType: 'workspace',
    entityId: workspace.id,
  });
  return serializeWorkspace(workspace, 'OWNER');
}

// GET /api/v1/workspaces
workspacesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await listWorkspacesForUser(req.userId!) });
  })
);

// POST /api/v1/workspaces
workspacesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name } = parse(z.object({ name: z.string().trim().min(1).max(80) }), req.body);
    res.status(201).json({ success: true, data: await createWorkspaceForUser(req.userId!, name) });
  })
);

// POST /api/v1/workspaces/join — join a friend's workspace with its invite code
workspacesRouter.post(
  '/join',
  asyncHandler(async (req, res) => {
    const { code } = parse(z.object({ code: z.string().trim().min(4).max(20) }), req.body);
    const workspace = await prisma.workspace.findUnique({ where: { inviteCode: normalizeInviteCode(code) } });
    if (!workspace) throw new HttpError(404, 'That invite code is not valid. Check it and try again.');

    const existing = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: req.userId!, workspaceId: workspace.id } },
    });
    if (existing) {
      res.json({ success: true, data: await serializeWorkspace(workspace, existing.role), alreadyMember: true });
      return;
    }

    const member = await prisma.workspaceMember.create({
      data: { userId: req.userId!, workspaceId: workspace.id, role: 'MEMBER' },
      include: { user: { select: publicUserSelect } },
    });
    await recordActivity({
      workspaceId: workspace.id,
      actorId: req.userId!,
      type: 'MEMBER_JOINED',
      summary: 'joined the workspace with an invite code',
      entityType: 'member',
      entityId: req.userId!,
    });
    wsManager.toWorkspace(workspace.id, 'MEMBER_JOINED', { ...member.user, role: member.role, joinedAt: member.joinedAt });
    res.status(201).json({ success: true, data: await serializeWorkspace(workspace, member.role) });
  })
);

// GET /api/v1/workspaces/:workspaceId
workspacesRouter.get(
  '/:workspaceId',
  requireMember(),
  asyncHandler(async (req, res) => {
    const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: req.membership!.workspaceId } });
    res.json({ success: true, data: await serializeWorkspace(workspace, req.membership!.role) });
  })
);

// PATCH /api/v1/workspaces/:workspaceId — rename / connect repository
const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  repoFullName: z
    .string()
    .trim()
    .regex(/^[\w.-]+\/[\w.-]+$/, 'Use the "owner/repo" format')
    .nullable()
    .optional(),
  defaultBranch: z.string().trim().min(1).max(100).optional(),
});

workspacesRouter.patch(
  '/:workspaceId',
  requireMember('ADMIN'),
  asyncHandler(async (req, res) => {
    const body = parse(updateWorkspaceSchema, req.body);
    const workspaceId = req.membership!.workspaceId;
    const before = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
    const repoChanged =
      (body.repoFullName !== undefined && body.repoFullName !== before.repoFullName) ||
      (body.defaultBranch !== undefined && body.defaultBranch !== before.defaultBranch);
    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      // Force a fresh sync when the repo/branch changes.
      data: { ...body, ...(repoChanged && { githubSyncedAt: null }) },
    });

    const payload = await serializeWorkspace(workspace, req.membership!.role);
    wsManager.toWorkspace(workspaceId, 'WORKSPACE_UPDATED', { ...payload, inviteCode: undefined, role: undefined });
    if (body.repoFullName !== undefined && body.repoFullName !== before.repoFullName) {
      await recordActivity({
        workspaceId,
        actorId: req.userId!,
        type: 'REPO_CONNECTED',
        summary: body.repoFullName ? `connected repository ${body.repoFullName}` : 'disconnected the repository',
        entityType: 'workspace',
        entityId: workspaceId,
      });
    }
    res.json({ success: true, data: payload });
  })
);

// POST /api/v1/workspaces/:workspaceId/invite-code — regenerate (old code stops working)
workspacesRouter.post(
  '/:workspaceId/invite-code',
  requireMember('ADMIN'),
  asyncHandler(async (req, res) => {
    const workspace = await withUniqueInviteCode((inviteCode) =>
      prisma.workspace.update({ where: { id: req.membership!.workspaceId }, data: { inviteCode } })
    );
    res.json({ success: true, data: await serializeWorkspace(workspace, req.membership!.role) });
  })
);

// GET /api/v1/workspaces/:workspaceId/members — members + live presence
workspacesRouter.get(
  '/:workspaceId/members',
  requireMember(),
  asyncHandler(async (req, res) => {
    const workspaceId = req.membership!.workspaceId;
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: publicUserSelect } },
      orderBy: { joinedAt: 'asc' },
    });
    const online = new Set(wsManager.getPresence(workspaceId).map((p) => p.userId));
    res.json({
      success: true,
      data: members.map((m) => ({ ...m.user, role: m.role, joinedAt: m.joinedAt, online: online.has(m.userId) })),
    });
  })
);

// POST /api/v1/workspaces/:workspaceId/members — add an existing user by email
workspacesRouter.post(
  '/:workspaceId/members',
  requireMember('ADMIN'),
  asyncHandler(async (req, res) => {
    const body = parse(
      z.object({
        email: z.string().trim().toLowerCase().email(),
        role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
      }),
      req.body
    );
    const workspaceId = req.membership!.workspaceId;
    const user = await prisma.user.findUnique({ where: { email: body.email }, select: publicUserSelect });
    if (!user) throw new HttpError(404, 'No Syncro account with that email — share the invite code instead');

    const existing = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId } },
    });
    if (existing) throw new HttpError(409, 'Already a member');

    const member = await prisma.workspaceMember.create({ data: { userId: user.id, workspaceId, role: body.role } });
    await recordActivity({
      workspaceId,
      actorId: req.userId!,
      type: 'MEMBER_JOINED',
      summary: `added ${user.name} as ${body.role.toLowerCase()}`,
      entityType: 'member',
      entityId: user.id,
    });
    res.status(201).json({ success: true, data: { ...user, role: member.role, joinedAt: member.joinedAt } });
  })
);

// DELETE /api/v1/workspaces/:workspaceId/membership — leave a workspace
workspacesRouter.delete(
  '/:workspaceId/membership',
  requireMember(),
  asyncHandler(async (req, res) => {
    const workspaceId = req.membership!.workspaceId;
    if (req.membership!.role === 'OWNER') {
      const owners = await prisma.workspaceMember.count({ where: { workspaceId, role: 'OWNER' } });
      if (owners <= 1) throw new HttpError(400, "You're the only owner — you can't leave your own workspace");
    }
    await recordActivity({
      workspaceId,
      actorId: req.userId!,
      type: 'MEMBER_LEFT',
      summary: 'left the workspace',
      entityType: 'member',
      entityId: req.userId!,
    });
    await prisma.workspaceMember.delete({ where: { userId_workspaceId: { userId: req.userId!, workspaceId } } });
    res.json({ success: true, data: { workspaceId } });
  })
);

// GET /api/v1/workspaces/:workspaceId/activities — the unified timeline
workspacesRouter.get(
  '/:workspaceId/activities',
  requireMember(),
  asyncHandler(async (req, res) => {
    const { limit, before } = parse(
      z.object({
        limit: z.coerce.number().int().min(1).max(200).default(50),
        before: z.string().datetime().optional(),
      }),
      req.query
    );
    const activities = await prisma.activityRecord.findMany({
      where: {
        workspaceId: req.membership!.workspaceId,
        ...(before && { createdAt: { lt: new Date(before) } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: activityInclude,
    });
    res.json({ success: true, data: activities });
  })
);

// Nested resources
workspacesRouter.use('/:workspaceId/tasks', requireMember(), tasksRouter);
workspacesRouter.use('/:workspaceId/commits', requireMember(), commitsRouter);
workspacesRouter.use('/:workspaceId/events', requireMember(), eventsRouter);
workspacesRouter.use('/:workspaceId/telemetry', requireMember(), telemetryRouter);
