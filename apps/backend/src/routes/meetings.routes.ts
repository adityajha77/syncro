import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { MeetingProvider } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, parse, HttpError } from '../lib/http.js';
import { publicUserSelect } from '../lib/auth.js';
import { wsManager } from '../lib/websocket.js';
import { recordActivity } from '../services/activity.service.js';
import { getAccessToken, googleApi, zoomApi } from '../services/integrations.service.js';

// Mounted at /workspaces/:workspaceId/meetings behind requireMember()
// Meetings without leaving Syncro: instant rooms (no account needed), Google Meet, Zoom.
export const meetingsRouter = Router({ mergeParams: true });

const meetingInclude = {
  createdBy: { select: publicUserSelect },
  task: { select: { id: true, title: true } },
} as const;

const PROVIDER_LABEL: Record<MeetingProvider, string> = { INSTANT: 'instant', GOOGLE_MEET: 'Google Meet', ZOOM: 'Zoom' };

const createSchema = z.object({
  title: z.string().trim().min(1, 'Give the meeting a title').max(160),
  provider: z.nativeEnum(MeetingProvider).default('INSTANT'),
  /** Omit to start now. */
  startsAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date')
    .optional(),
  durationMinutes: z.coerce.number().int().min(5).max(480).default(30),
  taskId: z.string().uuid().nullable().optional(),
  /** Google Meet only: email calendar invites to every workspace member. */
  inviteMembers: z.boolean().default(false),
});

// GET /meetings — live and upcoming first, then the recent past
meetingsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const since = new Date(Date.now() - 7 * 86_400_000);
    const data = await prisma.meeting.findMany({
      where: { workspaceId: req.membership!.workspaceId, startsAt: { gte: since } },
      include: meetingInclude,
      orderBy: { startsAt: 'asc' },
      take: 200,
    });
    res.json({ success: true, data });
  })
);

// POST /meetings
meetingsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    if (req.membership!.role === 'VIEWER') throw new HttpError(403, 'Viewers cannot schedule meetings');
    const body = parse(createSchema, req.body);
    const workspaceId = req.membership!.workspaceId;
    const startsAt = body.startsAt ? new Date(body.startsAt) : new Date();
    const endsAt = new Date(startsAt.getTime() + body.durationMinutes * 60_000);
    const task = body.taskId ? await prisma.task.findFirst({ where: { id: body.taskId, workspaceId } }) : null;
    if (body.taskId && !task) throw new HttpError(404, 'Task not found');

    let joinUrl: string;
    let externalId: string | null = null;

    if (body.provider === 'INSTANT') {
      const ws = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { slug: true } });
      const room = `Syncro-${ws.slug.replace(/[^a-z0-9]/gi, '')}-${randomBytes(5).toString('hex')}`;
      joinUrl = `https://meet.jit.si/${room}`;
    } else if (body.provider === 'GOOGLE_MEET') {
      const token = await getAccessToken(req.userId!, 'GOOGLE');
      const attendees = body.inviteMembers
        ? (
            await prisma.workspaceMember.findMany({
              where: { workspaceId, userId: { not: req.userId! } },
              include: { user: { select: { email: true } } },
            })
          ).map((m) => ({ email: m.user.email }))
        : [];
      const ev = await googleApi<{ id: string; hangoutLink?: string; htmlLink: string }>(
        token,
        `/calendars/primary/events?conferenceDataVersion=1&sendUpdates=${body.inviteMembers ? 'all' : 'none'}`,
        {
          method: 'POST',
          body: JSON.stringify({
            summary: body.title,
            description: task ? `Syncro task: ${task.title}` : 'Scheduled from Syncro',
            start: { dateTime: startsAt.toISOString() },
            end: { dateTime: endsAt.toISOString() },
            attendees,
            conferenceData: {
              createRequest: { requestId: randomBytes(8).toString('hex'), conferenceSolutionKey: { type: 'hangoutsMeet' } },
            },
          }),
        }
      );
      if (!ev.hangoutLink) {
        throw new HttpError(502, 'Google created the event but no Meet link — Meet may be disabled for this Google account.');
      }
      joinUrl = ev.hangoutLink;
      externalId = ev.id;
    } else {
      const token = await getAccessToken(req.userId!, 'ZOOM');
      const zm = await zoomApi<{ id: number; join_url: string }>(token, '/users/me/meetings', {
        method: 'POST',
        body: JSON.stringify({
          topic: body.title,
          type: 2, // scheduled
          start_time: startsAt.toISOString(),
          duration: body.durationMinutes,
          settings: { join_before_host: true, waiting_room: false },
        }),
      });
      joinUrl = zm.join_url;
      externalId = String(zm.id);
    }

    const meeting = await prisma.meeting.create({
      data: {
        title: body.title,
        provider: body.provider,
        joinUrl,
        externalId,
        startsAt,
        durationMinutes: body.durationMinutes,
        workspaceId,
        taskId: task?.id ?? null,
        createdById: req.userId!,
      },
      include: meetingInclude,
    });

    const startsNow = startsAt.getTime() - Date.now() < 2 * 60_000;
    wsManager.toWorkspace(workspaceId, 'MEETING_CREATED', meeting);
    await recordActivity({
      workspaceId,
      actorId: req.userId!,
      type: startsNow ? 'MEETING_STARTED' : 'MEETING_SCHEDULED',
      summary: startsNow
        ? `started ${body.provider === 'INSTANT' ? 'an' : 'a'} ${PROVIDER_LABEL[body.provider]} meeting "${body.title}"`
        : `scheduled ${body.provider === 'INSTANT' ? 'an' : 'a'} ${PROVIDER_LABEL[body.provider]} meeting "${body.title}"`,
      entityType: 'meeting',
      entityId: meeting.id,
      metadata: { provider: body.provider, startsAt: startsAt.toISOString() },
    });
    res.status(201).json({ success: true, data: meeting });
  })
);

// DELETE /meetings/:meetingId — creator or admin; cancels at the provider too (best effort)
meetingsRouter.delete(
  '/:meetingId',
  asyncHandler(async (req, res) => {
    const workspaceId = req.membership!.workspaceId;
    const meeting = await prisma.meeting.findFirst({ where: { id: String(req.params.meetingId), workspaceId } });
    if (!meeting) throw new HttpError(404, 'Meeting not found');
    const isAdmin = req.membership!.role === 'OWNER' || req.membership!.role === 'ADMIN';
    if (meeting.createdById !== req.userId && !isAdmin) throw new HttpError(403, 'Only the organiser can cancel this meeting');

    if (meeting.externalId && meeting.createdById === req.userId) {
      try {
        if (meeting.provider === 'GOOGLE_MEET') {
          const token = await getAccessToken(req.userId!, 'GOOGLE');
          await googleApi(token, `/calendars/primary/events/${meeting.externalId}?sendUpdates=all`, { method: 'DELETE' });
        } else if (meeting.provider === 'ZOOM') {
          const token = await getAccessToken(req.userId!, 'ZOOM');
          await zoomApi(token, `/meetings/${meeting.externalId}`, { method: 'DELETE' });
        }
      } catch (err) {
        console.warn('[Meetings] provider cancel failed', err);
      }
    }
    await prisma.meeting.delete({ where: { id: meeting.id } });
    wsManager.toWorkspace(workspaceId, 'MEETING_DELETED', { id: meeting.id });
    res.json({ success: true, data: { id: meeting.id } });
  })
);
