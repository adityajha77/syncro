import jwt from 'jsonwebtoken';
import { IntegrationProvider } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { config, isGithubConfigured, isGoogleConfigured } from '../config.js';
import { encryptSecret, decryptSecret } from '../lib/crypto.js';
import { HttpError } from '../lib/http.js';

/**
 * OAuth for GitHub and Google Calendar.
 *
 * Flow: UI calls GET /integrations/:provider/connect (authenticated) and gets an
 * authorize URL whose `state` is a short-lived signed JWT naming the user. The
 * provider redirects the browser to GET /integrations/:provider/callback, which
 * verifies the state, exchanges the code, stores encrypted tokens, and
 * redirects back to the UI's /profile page.
 */

export type ProviderKey = 'github' | 'google';

export const PROVIDERS: Record<ProviderKey, { enumValue: IntegrationProvider; configured: () => boolean }> = {
  github: { enumValue: 'GITHUB', configured: isGithubConfigured },
  google: { enumValue: 'GOOGLE', configured: isGoogleConfigured },
};

const GITHUB_SCOPES = 'read:user repo';
export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const GOOGLE_SCOPES = ['openid', 'email', GOOGLE_CALENDAR_SCOPE].join(' ');

/**
 * Google uses granular consent: users can untick the Calendar checkbox and still
 * "connect". Such a token only has openid/email, and every Calendar call fails.
 */
export const hasRequiredScopes = (provider: IntegrationProvider, granted: string) =>
  provider === 'GOOGLE' ? granted.split(/[\s,]+/).includes(GOOGLE_CALENDAR_SCOPE) : true;

export const MISSING_CALENDAR_PERMISSION =
  'Calendar permission was not granted. Click Connect again and, on the Google screen, tick "See, edit, create and delete all your Google Calendar events".';

export const callbackUrl = (p: ProviderKey) => `${config.apiPublicUrl}/api/v1/integrations/${p}/callback`;

// ---------------- state ----------------
interface OAuthState {
  sub: string;
  provider: ProviderKey;
  purpose: 'oauth';
}

export function signState(userId: string, provider: ProviderKey): string {
  return jwt.sign({ sub: userId, provider, purpose: 'oauth' } satisfies OAuthState, config.jwtSecret, {
    expiresIn: '10m',
  });
}

export function verifyState(state: string, provider: ProviderKey): string {
  try {
    const d = jwt.verify(state, config.jwtSecret) as OAuthState;
    if (d.purpose !== 'oauth' || d.provider !== provider) throw new Error('mismatch');
    return d.sub;
  } catch {
    throw new HttpError(400, 'OAuth state is invalid or expired. Please try connecting again.');
  }
}

// ---------------- authorize URLs ----------------
export function authorizeUrl(provider: ProviderKey, userId: string): string {
  if (!PROVIDERS[provider].configured()) {
    throw new HttpError(503, `${provider === 'github' ? 'GitHub' : 'Google'} integration is not configured on the server`);
  }
  const state = signState(userId, provider);
  if (provider === 'github') {
    const q = new URLSearchParams({
      client_id: config.github.clientId,
      redirect_uri: callbackUrl('github'),
      scope: GITHUB_SCOPES,
      state,
      allow_signup: 'false',
    });
    return `https://github.com/login/oauth/authorize?${q}`;
  }
  const q = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: callbackUrl('google'),
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    access_type: 'offline', // get a refresh token
    prompt: 'consent', // always return refresh token on reconnect
    include_granted_scopes: 'true',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

// ---------------- code exchange ----------------
async function postForm(url: string, body: Record<string, string>) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || json.error) {
    throw new HttpError(502, `Token exchange failed: ${String(json.error_description || json.error || res.status)}`);
  }
  return json;
}

export async function completeOAuth(provider: ProviderKey, code: string, userId: string) {
  if (provider === 'github') {
    const tok = await postForm('https://github.com/login/oauth/access_token', {
      client_id: config.github.clientId,
      client_secret: config.github.clientSecret,
      code,
      redirect_uri: callbackUrl('github'),
    });
    const accessToken = String(tok.access_token);
    const me = await githubApi<{ id: number; login: string }>(accessToken, '/user');
    return saveIntegration(userId, 'GITHUB', {
      accountId: String(me.id),
      accountLabel: me.login,
      scopes: String(tok.scope ?? GITHUB_SCOPES),
      accessToken,
    });
  }

  const tok = await postForm('https://oauth2.googleapis.com/token', {
    client_id: config.google.clientId,
    client_secret: config.google.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: callbackUrl('google'),
  });
  const accessToken = String(tok.access_token);
  const grantedScopes = String(tok.scope ?? '');
  if (!hasRequiredScopes('GOOGLE', grantedScopes)) {
    // Don't keep a half-granted connection: revoke it and ask the user to retry.
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, { method: 'POST' }).catch(() => {});
    throw new HttpError(400, MISSING_CALENDAR_PERMISSION);
  }
  const info = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((r) => r.json() as Promise<{ sub: string; email: string }>);
  return saveIntegration(userId, 'GOOGLE', {
    accountId: info.sub,
    accountLabel: info.email,
    scopes: grantedScopes,
    accessToken,
    refreshToken: tok.refresh_token ? String(tok.refresh_token) : undefined,
    expiresInSec: Number(tok.expires_in) || 3600,
  });
}

async function saveIntegration(
  userId: string,
  provider: IntegrationProvider,
  t: { accountId: string; accountLabel: string; scopes: string; accessToken: string; refreshToken?: string; expiresInSec?: number }
) {
  const data = {
    accountId: t.accountId,
    accountLabel: t.accountLabel,
    scopes: t.scopes,
    accessTokenEnc: encryptSecret(t.accessToken),
    accessTokenExpires: t.expiresInSec ? new Date(Date.now() + (t.expiresInSec - 60) * 1000) : null,
    // Keep an existing refresh token if the provider didn't send a new one.
    ...(t.refreshToken && { refreshTokenEnc: encryptSecret(t.refreshToken) }),
  };
  return prisma.integration.upsert({
    where: { userId_provider: { userId, provider } },
    create: { userId, provider, ...data },
    update: data,
  });
}

// ---------------- token access ----------------
export async function getAccessToken(userId: string, provider: IntegrationProvider): Promise<string> {
  const integ = await prisma.integration.findUnique({ where: { userId_provider: { userId, provider } } });
  if (!integ) {
    throw new HttpError(400, `Connect your ${provider === 'GITHUB' ? 'GitHub' : 'Google'} account in your profile first`);
  }
  if (!hasRequiredScopes(provider, integ.scopes)) {
    throw new HttpError(403, MISSING_CALENDAR_PERMISSION);
  }
  const notExpired = !integ.accessTokenExpires || integ.accessTokenExpires > new Date();
  if (notExpired) return decryptSecret(integ.accessTokenEnc);

  // Google access tokens last ~1h; refresh using the stored refresh token.
  if (provider !== 'GOOGLE' || !integ.refreshTokenEnc) {
    throw new HttpError(401, 'Integration token expired — please reconnect');
  }
  try {
    const tok = await postForm('https://oauth2.googleapis.com/token', {
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      refresh_token: decryptSecret(integ.refreshTokenEnc),
      grant_type: 'refresh_token',
    });
    const accessToken = String(tok.access_token);
    await prisma.integration.update({
      where: { id: integ.id },
      data: {
        accessTokenEnc: encryptSecret(accessToken),
        accessTokenExpires: new Date(Date.now() + ((Number(tok.expires_in) || 3600) - 60) * 1000),
      },
    });
    return accessToken;
  } catch {
    throw new HttpError(401, 'Google access was revoked or expired — please reconnect Google Calendar');
  }
}

/** Best-effort revoke at the provider, then delete locally. */
export async function disconnect(userId: string, provider: IntegrationProvider) {
  const integ = await prisma.integration.findUnique({ where: { userId_provider: { userId, provider } } });
  if (!integ) return;
  try {
    const token = decryptSecret(integ.refreshTokenEnc ?? integ.accessTokenEnc);
    if (provider === 'GOOGLE') {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: 'POST' });
    } else if (isGithubConfigured()) {
      await fetch(`https://api.github.com/applications/${config.github.clientId}/grant`, {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.github.clientId}:${config.github.clientSecret}`).toString('base64')}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: token }),
      });
    }
  } catch {
    /* revoke is best-effort */
  }
  await prisma.integration.delete({ where: { id: integ.id } });
}

// ---------------- provider API helpers ----------------
export async function githubApi<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'syncro-app',
    },
  });
  if (res.status === 401) throw new HttpError(401, 'GitHub access was revoked — please reconnect GitHub');
  if (res.status === 404) throw new HttpError(404, 'Repository or branch not found (or no access)');
  if (res.status === 409) return [] as T; // empty repository
  if (!res.ok) throw new HttpError(502, `GitHub API error ${res.status}`);
  return res.json() as Promise<T>;
}

export async function googleApi<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
  });
  if (res.status === 401) throw new HttpError(401, 'Google access was revoked — please reconnect Google Calendar');
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string; details?: { reason?: string }[]; errors?: { reason?: string }[] };
    };
    const reasons = [...(body.error?.details ?? []), ...(body.error?.errors ?? [])].map((d) => d.reason);
    if (res.status === 403 && (reasons.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT') || /insufficient authentication scopes/i.test(body.error?.message ?? ''))) {
      throw new HttpError(403, MISSING_CALENDAR_PERMISSION);
    }
    if (res.status === 403 && /has not been used|is disabled/i.test(body.error?.message ?? '')) {
      throw new HttpError(503, 'Google Calendar API is not enabled for this Google Cloud project — enable it in the Google Cloud console.');
    }
    throw new HttpError(502, `Google Calendar error: ${body.error?.message || res.status}`);
  }
  return (res.status === 204 ? undefined : res.json()) as Promise<T>;
}
