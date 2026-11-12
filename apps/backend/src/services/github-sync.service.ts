import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/http.js';
import { wsManager } from '../lib/websocket.js';
import { publicUserSelect } from '../lib/auth.js';
import { recordActivity } from './activity.service.js';
import { getAccessToken, githubApi } from './integrations.service.js';

interface GhCommit {
  sha: string;
  html_url: string;
  commit: { message: string; author: { name: string; date: string } | null };
  author: { login: string } | null;
}

export const commitInclude = { author: { select: publicUserSelect } } as const;

/**
 * Pulls the latest commits for a workspace's connected repo using `actingUserId`'s
 * GitHub token, stores new ones, and pushes them live. Idempotent: commits are
 * unique per (workspace, sha).
 */
export async function syncWorkspaceCommits(workspaceId: string, actingUserId: string, opts: { silent?: boolean } = {}) {
  const ws = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  if (!ws.repoFullName) throw new HttpError(400, 'Connect a repository to this workspace first');

  const token = await getAccessToken(actingUserId, 'GITHUB');
  const [owner, repo] = ws.repoFullName.split('/');
  const gh = await githubApi<GhCommit[]>(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?sha=${encodeURIComponent(ws.defaultBranch)}&per_page=30`
  );

  // Map GitHub logins of workspace members → Syncro user ids.
  const memberLinks = await prisma.integration.findMany({
    where: { provider: 'GITHUB', user: { memberships: { some: { workspaceId } } } },
    select: { userId: true, accountLabel: true },
  });
  const byLogin = new Map(memberLinks.map((m) => [m.accountLabel.toLowerCase(), m.userId]));

  const existing = await prisma.commit.findMany({
    where: { workspaceId, sha: { in: gh.map((c) => c.sha) } },
    select: { sha: true },
  });
  const known = new Set(existing.map((c) => c.sha));
  const fresh = gh.filter((c) => !known.has(c.sha));

  if (fresh.length) {
    await prisma.commit.createMany({
      skipDuplicates: true,
      data: fresh.map((c) => ({
        workspaceId,
        sha: c.sha,
        message: c.commit.message.split('\n')[0].slice(0, 500),
        branch: ws.defaultBranch,
        source: 'GITHUB' as const,
        url: c.html_url,
        authorName: c.commit.author?.name || c.author?.login || 'Unknown',
        authorLogin: c.author?.login ?? null,
        authorId: c.author?.login ? byLogin.get(c.author.login.toLowerCase()) ?? null : null,
        committedAt: c.commit.author?.date ? new Date(c.commit.author.date) : new Date(),
      })),
    });
    const created = await prisma.commit.findMany({
      where: { workspaceId, sha: { in: fresh.map((c) => c.sha) } },
      include: commitInclude,
      orderBy: { committedAt: 'asc' },
    });
    for (const c of created) wsManager.toWorkspace(workspaceId, 'COMMIT_CREATED', c);

    await recordActivity({
      workspaceId,
      actorId: actingUserId,
      type: 'COMMITS_SYNCED',
      summary: `synced ${fresh.length} new commit${fresh.length === 1 ? '' : 's'} from ${ws.repoFullName}`,
      entityType: 'workspace',
      entityId: workspaceId,
      metadata: { repo: ws.repoFullName, branch: ws.defaultBranch, shas: fresh.map((c) => c.sha.slice(0, 7)) },
    });
  }

  await prisma.workspace.update({ where: { id: workspaceId }, data: { githubSyncedAt: new Date() } });
  if (!opts.silent) console.log(`[GitHub] ${ws.repoFullName}: ${fresh.length} new of ${gh.length}`);
  return { added: fresh.length, fetched: gh.length, syncedAt: new Date().toISOString() };
}

/**
 * Background poller: keeps connected repos fresh without webhooks (which would
 * need a public URL). Uses any member's GitHub connection, preferring owners.
 */
export function startGithubPoller(intervalMs = 3 * 60_000) {
  const tick = async () => {
    const staleBefore = new Date(Date.now() - intervalMs + 10_000);
    const workspaces = await prisma.workspace.findMany({
      where: {
        repoFullName: { not: null },
        OR: [{ githubSyncedAt: null }, { githubSyncedAt: { lt: staleBefore } }],
      },
      select: {
        id: true,
        members: {
          where: { user: { integrations: { some: { provider: 'GITHUB' } } } },
          select: { userId: true, role: true },
          orderBy: { joinedAt: 'asc' },
        },
      },
      take: 25,
    });
    for (const ws of workspaces) {
      const actor = ws.members.find((m) => m.role === 'OWNER') ?? ws.members[0];
      if (!actor) continue;
      try {
        await syncWorkspaceCommits(ws.id, actor.userId, { silent: true });
      } catch (err) {
        console.warn(`[GitHub] background sync failed for ${ws.id}:`, err instanceof Error ? err.message : err);
        // Back off this workspace until the next interval.
        await prisma.workspace.update({ where: { id: ws.id }, data: { githubSyncedAt: new Date() } }).catch(() => {});
      }
    }
  };
  const timer = setInterval(() => void tick().catch((e) => console.warn('[GitHub] poller error', e)), intervalMs);
  timer.unref();
  return timer;
}
