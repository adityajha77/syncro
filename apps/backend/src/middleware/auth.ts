import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../lib/auth.js';
import { HttpError, asyncHandler } from '../lib/http.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      membership?: { workspaceId: string; role: Role };
    }
  }
}

/** Requires a valid `Authorization: Bearer <jwt>` header. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    next(new HttpError(401, 'Authentication required'));
    return;
  }
  req.userId = payload.sub;
  next();
}

const ROLE_RANK: Record<Role, number> = { VIEWER: 0, MEMBER: 1, ADMIN: 2, OWNER: 3 };

/**
 * Requires the authenticated user to be a member of `:workspaceId`
 * with at least `minRole`. Must run after requireAuth.
 */
export const requireMember = (minRole: Role = 'VIEWER') =>
  asyncHandler(async (req, _res, next) => {
    const workspaceId = String(req.params.workspaceId);
    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: req.userId!, workspaceId } },
    });
    if (!member) throw new HttpError(404, 'Workspace not found');
    if (ROLE_RANK[member.role] < ROLE_RANK[minRole]) {
      throw new HttpError(403, `Requires ${minRole} role`);
    }
    req.membership = { workspaceId, role: member.role };
    next();
  });
