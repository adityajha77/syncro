import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, parse, HttpError } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config.js';
import {
  PROVIDERS,
  ProviderKey,
  authorizeUrl,
  completeOAuth,
  verifyState,
  disconnect,
  getAccessToken,
  githubApi,
  googleApi,
  hasRequiredScopes,
} from '../services/integrations.service.js';

export const integrationsRouter = Router();

const providerParam = (raw: unknown): ProviderKey => {
  const p = String(raw);
  if (p !== 'github' && p !== 'google') throw new HttpError(404, 'Unknown integration');
  return p;
};

// GET /integrations — status of each provider for the current user
integrationsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await prisma.integration.findMany({ where: { userId: req.userId } });
    const data = (Object.keys(PROVIDERS) as ProviderKey[]).map((key) => {
      const row = rows.find((r) => r.provider === PROVIDERS[key].enumValue);
      return {
        provider: key,
        configured: PROVIDERS[key].configured(),
        connected: !!row,
        // Connected, but without the permissions Syncro needs (e.g. Calendar box unticked)
        needsReconnect: !!row && !hasRequiredScopes(row.provider, row.scopes),
        accountLabel: row?.accountLabel ?? null,
        connectedAt: row?.createdAt ?? null,
      };
    });
    res.json({ success: true, data });
  })
);

// GET /integrations/github/repos — repos the user can pick for a workspace
integrationsRouter.get(
  '/github/repos',
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = await getAccessToken(req.userId!, 'GITHUB');
    const repos = await githubApi<
      { full_name: string; private: boolean; default_branch: string; pushed_at: string; description: string | null }[]
    >(token, '/user/repos?sort=pushed&per_page=50&affiliation=owner,collaborator,organization_member');
    res.json({
      success: true,
      data: repos.map((r) => ({
        fullName: r.full_name,
        private: r.private,
        defaultBranch: r.default_branch,
        pushedAt: r.pushed_at,
        description: r.description,
      })),
    });
  })
);

// GET /integrations/google/events?from&to — the user's own Google Calendar
integrationsRouter.get(
  '/google/events',
  requireAuth,
  asyncHandler(async (req, res) => {
    const q = parse(z.object({ from: z.string().datetime(), to: z.string().datetime() }), req.query);
    const token = await getAccessToken(req.userId!, 'GOOGLE');
    const params = new URLSearchParams({
      timeMin: q.from,
      timeMax: q.to,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    });
    const data = await googleApi<{
      items?: {
        id: string;
        summary?: string;
        htmlLink: string;
        hangoutLink?: string;
        location?: string;
        start: { dateTime?: string; date?: string };
        end: { dateTime?: string; date?: string };
      }[];
    }>(token, `/calendars/primary/events?${params}`);
    res.json({
      success: true,
      data: (data.items ?? []).map((e) => ({
        id: e.id,
        title: e.summary || '(No title)',
        startsAt: e.start.dateTime ?? e.start.date!,
        endsAt: e.end.dateTime ?? e.end.date ?? null,
        allDay: !e.start.dateTime,
        location: e.hangoutLink || e.location || null,
        htmlLink: e.htmlLink,
      })),
    });
  })
);

// GET /integrations/:provider/connect — returns the provider authorize URL
integrationsRouter.get(
  '/:provider/connect',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: { url: authorizeUrl(providerParam(req.params.provider), req.userId!) } });
  })
);

// GET /integrations/:provider/callback — PUBLIC: provider redirects the browser here
integrationsRouter.get('/:provider/callback', async (req, res) => {
  const provider = String(req.params.provider);
  const back = (status: 'connected' | 'error', message?: string) => {
    const q = new URLSearchParams({ integration: provider, status, ...(message && { message }) });
    res.redirect(`${config.clientOrigin}/profile?${q}`);
  };
  try {
    const p = providerParam(provider);
    if (req.query.error) return back('error', String(req.query.error_description || req.query.error));
    const code = String(req.query.code || '');
    if (!code) return back('error', 'Missing authorization code');
    const userId = verifyState(String(req.query.state || ''), p);
    await completeOAuth(p, code, userId);
    back('connected');
  } catch (err) {
    console.error('[OAuth] callback failed', err);
    back('error', err instanceof Error ? err.message : 'Connection failed');
  }
});

// DELETE /integrations/:provider
integrationsRouter.delete(
  '/:provider',
  requireAuth,
  asyncHandler(async (req, res) => {
    const p = providerParam(req.params.provider);
    await disconnect(req.userId!, PROVIDERS[p].enumValue);
    res.json({ success: true, data: { provider: p, connected: false } });
  })
);
