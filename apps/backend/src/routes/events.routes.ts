import { Router } from 'express';
import { z } from 'zod';
import { EventCategory } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, parse, HttpError } from '../lib/http.js';
import { publicUserSelect } from '../lib/auth.js';
import { wsManager } from '../lib/websocket.js';
import { recordActivity } from '../services/activity.service.js';
import { getAccessToken, googleApi } from '../services/integrations.service.js';

// Mounted at /workspaces/:workspaceId/events behind requireMember()
export const eventsRouter = Router({ mergeParams: true });

const eventInclude = { createdBy: { select: publicUserSelect } } as const;

// GET /events?from=ISO&to=ISO
eventsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = parse(z.object({ from: z.string().datetime().optional(), to: z.string().datetime().optional() }), req.query);
    const events = await prisma.calendarEvent.findMany({
      where: {
        workspaceId: req.membership!.workspaceId,
        ...((q.from || q.to) && {
          startsAt: { ...(q.from && { gte: new Date(q.from) }), ...(q.to && { lt: new Date(q.to) }) },
        }),
      },
      orderBy: { startsAt: 'asc' },
      include: eventInclude,
    });
    res.json({ success: true, data: events });
  })
);

eventsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    if (req.membership!.role === 'VIEWER') throw new HttpError(403, 'Viewers cannot schedule events');
    const body = parse(
      z.object({
        title: z.string().trim().min(1).max(200),
        startsAt: z.string().datetime({ offset: true }).transform((v) => new Date(v)),
        category: z.nativeEnum(EventCategory).default('SYNC'),
        location: z.string().trim().max(200).optional(),
        durationMinutes: z.number().int().min(5).max(24 * 60).default(30),
        addToGoogle: z.boolean().default(false),
      }),
      req.body
    );
    const { addToGoogle, durationMinutes, ...fields } = body;
    const workspaceId = req.membership!.workspaceId;

    // Optionally mirror to the creator's Google Calendar first, so a failure there
    // is reported before anything is saved.
    let googleEventId: string | null = null;
    if (addToGoogle) {
      const token = await getAccessToken(req.userId!, 'GOOGLE');
      const ws = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { name: true } });
      const g = await googleApi<{ id: string }>(token, '/calendars/primary/events', {
        method: 'POST',
        body: JSON.stringify({
          summary: fields.title,
          description: `${fields.category} · scheduled in Syncro workspace "${ws.name}"`,
          location: fields.location,
          start: { dateTime: fields.startsAt.toISOString() },
          end: { dateTime: new Date(fields.startsAt.getTime() + durationMinutes * 60_000).toISOString() },
        }),
      });
      googleEventId = g.id;
    }

    const event = await prisma.calendarEvent.create({
      data: { ...fields, googleEventId, workspaceId, createdById: req.userId! },
      include: eventInclude,
    });

    wsManager.toWorkspace(workspaceId, 'EVENT_CREATED', event);
    await recordActivity({
      workspaceId,
      actorId: req.userId!,
      type: 'EVENT_SCHEDULED',
      summary: `scheduled ${event.category.toLowerCase()} "${event.title}"`,
      entityType: 'event',
      entityId: event.id,
      metadata: { startsAt: event.startsAt.toISOString() },
    });
    res.status(201).json({ success: true, data: event });
  })
);

eventsRouter.delete(
  '/:eventId',
  asyncHandler(async (req, res) => {
    if (req.membership!.role === 'VIEWER') throw new HttpError(403, 'Viewers cannot delete events');
    const workspaceId = req.membership!.workspaceId;
    const event = await prisma.calendarEvent.findFirst({ where: { id: String(req.params.eventId), workspaceId } });
    if (!event) throw new HttpError(404, 'Event not found');
    await prisma.calendarEvent.delete({ where: { id: event.id } });

    // Remove the Google mirror too when the creator deletes it (best-effort).
    if (event.googleEventId && event.createdById === req.userId) {
      try {
        const token = await getAccessToken(req.userId!, 'GOOGLE');
        await googleApi(token, `/calendars/primary/events/${encodeURIComponent(event.googleEventId)}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('[Google] could not delete mirrored event', err instanceof Error ? err.message : err);
      }
    }

    wsManager.toWorkspace(workspaceId, 'EVENT_DELETED', { id: event.id });
    await recordActivity({
      workspaceId,
      actorId: req.userId!,
      type: 'EVENT_DELETED',
      summary: `cancelled "${event.title}"`,
      entityType: 'event',
      entityId: event.id,
    });
    res.json({ success: true, data: { id: event.id } });
  })
);
