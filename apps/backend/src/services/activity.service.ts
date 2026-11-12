import { ActivityType, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { wsManager } from '../lib/websocket.js';
import { publicUserSelect } from '../lib/auth.js';

/**
 * Universal Activity Ledger.
 *
 * Every mutation in a workspace calls `recordActivity`, which appends an
 * immutable row and pushes it to everyone currently in the workspace room.
 * The timeline, telemetry and standup rollups are all derived from this table.
 */
export interface RecordActivityInput {
  workspaceId: string;
  actorId: string;
  type: ActivityType;
  summary: string;
  entityType?: 'task' | 'commit' | 'event' | 'workspace' | 'member';
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}

export const activityInclude = { actor: { select: publicUserSelect } } as const;

export async function recordActivity(input: RecordActivityInput) {
  const activity = await prisma.activityRecord.create({
    data: input,
    include: activityInclude,
  });
  wsManager.toWorkspace(input.workspaceId, 'ACTIVITY_RECORDED', activity);
  return activity;
}
