import { Router } from 'express';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, parse, HttpError } from '../lib/http.js';
import { wsManager } from '../lib/websocket.js';
import { recordActivity } from '../services/activity.service.js';
import { commitInclude, syncWorkspaceCommits } from '../services/github-sync.service.js';

// Mounted at /workspaces/:workspaceId/commits behind requireMember().
// Commits come from GitHub (sync / background poller) or are logged manually.
export const commitsRouter = Router({ mergeParams: true });

commitsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const commits = await prisma.commit.findMany({
      where: { workspaceId: req.membership!.workspaceId },
      orderBy: { committedAt: 'desc' },
      take: 50,
      include: commitInclude,
    });
    res.json({ success: true, data: commits });
  })
);

// POST /commits/sync — pull latest commits from GitHub now
commitsRouter.post(
  '/sync',
  asyncHandler(async (req, res) => {
    if (req.membership!.role === 'VIEWER') throw new HttpError(403, 'Viewers cannot sync commits');
    res.json({ success: true, data: await syncWorkspaceCommits(req.membership!.workspaceId, req.userId!) });
  })
);

// POST /commits — manual log (for repos not on GitHub)
commitsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    if (req.membership!.role === 'VIEWER') throw new HttpError(403, 'Viewers cannot log commits');
    const body = parse(
      z.object({
        message: z.string().trim().min(1).max(500),
        branch: z.string().trim().min(1).max(100).optional(),
        sha: z.string().trim().regex(/^[0-9a-f]{7,40}$/i).optional(),
      }),
      req.body
    );
    const workspaceId = req.membership!.workspaceId;
    const [workspace, me] = await Promise.all([
      prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } }),
      prisma.user.findUniqueOrThrow({ where: { id: req.userId }, select: { name: true } }),
    ]);

    const commit = await prisma.commit.create({
      data: {
        message: body.message,
        branch: body.branch || workspace.defaultBranch,
        sha: body.sha || randomBytes(20).toString('hex'),
        source: 'MANUAL',
        authorName: me.name,
        workspaceId,
        authorId: req.userId!,
      },
      include: commitInclude,
    });

    wsManager.toWorkspace(workspaceId, 'COMMIT_CREATED', commit);
    await recordActivity({
      workspaceId,
      actorId: req.userId!,
      type: 'COMMIT_PUSHED',
      summary: `logged ${commit.sha.slice(0, 7)} on ${commit.branch}: ${commit.message}`,
      entityType: 'commit',
      entityId: commit.id,
      metadata: { sha: commit.sha, branch: commit.branch, repo: workspace.repoFullName },
    });
    res.status(201).json({ success: true, data: commit });
  })
);
