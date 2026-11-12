import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, parse, HttpError } from '../lib/http.js';
import { hashPassword, verifyPassword, signToken, publicUserSelect } from '../lib/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { createWorkspaceForUser, listWorkspacesForUser } from './workspaces.routes.js';

export const authRouter = Router();

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  workspaceName: z.string().trim().min(1).max(80).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

// POST /api/v1/auth/signup — creates the user and their first workspace
authRouter.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const body = parse(signupSchema, req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new HttpError(409, 'An account with this email already exists');

    const user = await prisma.user.create({
      data: { name: body.name, email: body.email, passwordHash: await hashPassword(body.password) },
      select: publicUserSelect,
    });
    const workspace = await createWorkspaceForUser(user.id, body.workspaceName || `${body.name}'s Workspace`);

    res.status(201).json({ success: true, data: { token: signToken(user.id), user, workspaces: [workspace] } });
  })
);

// POST /api/v1/auth/login
authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = parse(loginSchema, req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      throw new HttpError(401, 'Invalid email or password');
    }
    const { passwordHash: _omit, updatedAt: _u, ...publicUser } = user;
    res.json({ success: true, data: { token: signToken(user.id), user: publicUser } });
  })
);

// GET /api/v1/auth/me — current user + workspaces they belong to
authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: publicUserSelect });
    if (!user) throw new HttpError(401, 'Account no longer exists');
    res.json({ success: true, data: { user, workspaces: await listWorkspacesForUser(user.id) } });
  })
);

// PATCH /api/v1/auth/me — update profile
authRouter.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = parse(z.object({ name: z.string().trim().min(1, 'Name is required').max(80) }), req.body);
    const user = await prisma.user.update({ where: { id: req.userId }, data: body, select: publicUserSelect });
    res.json({ success: true, data: user });
  })
);

// POST /api/v1/auth/change-password
authRouter.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = parse(
      z.object({
        currentPassword: z.string().min(1, 'Enter your current password'),
        newPassword: z.string().min(8, 'New password must be at least 8 characters').max(200),
      }),
      req.body
    );
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
    if (!(await verifyPassword(body.currentPassword, user.passwordHash))) {
      throw new HttpError(400, 'Current password is incorrect');
    }
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(body.newPassword) } });
    res.json({ success: true, data: { changed: true } });
  })
);
