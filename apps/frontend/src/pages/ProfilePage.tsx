import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Check,
  Copy,
  KeyRound,
  LayoutDashboard,
  Link2,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Shield,
  User as UserIcon,
  Users,
  DoorOpen,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { IntegrationKey, IntegrationStatus, Workspace } from '../types';
import { AppBackdrop, Avatar, Bento, BentoHeader, GithubIcon, ghostBtn, inputCls, labelCls, primaryBtn, useToast, wellCls } from '../components/ui';
import { AppHeader } from '../components/AppHeader';

const ROLE_STYLE: Record<string, string> = {
  OWNER: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300',
  ADMIN: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300',
  MEMBER: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  VIEWER: 'border-black/10 bg-zinc-100 text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300',
};

export const ProfilePage: React.FC = () => {
  const { user, setUser, workspaces, activeWorkspace, setActiveWorkspaceId, upsertWorkspace, removeWorkspace, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // ---- account
  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  // ---- security
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  // ---- integrations
  const [integrations, setIntegrations] = useState<IntegrationStatus[] | null>(null);
  const [integBusy, setIntegBusy] = useState<IntegrationKey | null>(null);

  // ---- workspaces
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fail = useCallback((err: unknown) => toast('error', err instanceof Error ? err.message : 'Something went wrong'), [toast]);

  const loadIntegrations = useCallback(() => {
    api.integrations().then(setIntegrations).catch(fail);
  }, [fail]);
  useEffect(loadIntegrations, [loadIntegrations]);

  // Result of an OAuth round-trip: /profile?integration=github&status=connected
  // Guarded by a ref: React StrictMode runs mount effects twice in development,
  // and both runs see the query string before it's cleared → duplicate toasts.
  const handledOAuthResult = useRef<string | null>(null);
  useEffect(() => {
    const which = params.get('integration');
    if (!which) return;
    const key = params.toString();
    if (handledOAuthResult.current === key) return;
    handledOAuthResult.current = key;
    const label = which === 'github' ? 'GitHub' : 'Google Calendar';
    if (params.get('status') === 'connected') toast('success', `${label} connected!`);
    else toast('error', `${label} connection failed: ${params.get('message') || 'unknown error'}`);
    setParams({}, { replace: true });
    loadIntegrations();
  }, [params, setParams, toast, loadIntegrations]);

  if (!user) return null;

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    try {
      setUser(await api.updateProfile({ name: name.trim() }));
      toast('success', 'Profile updated');
    } catch (err) {
      fail(err);
    } finally {
      setSavingName(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPw(true);
    try {
      await api.changePassword({ currentPassword: currentPw, newPassword: newPw });
      setCurrentPw('');
      setNewPw('');
      toast('success', 'Password changed');
    } catch (err) {
      fail(err);
    } finally {
      setSavingPw(false);
    }
  };

  const connect = async (p: IntegrationKey) => {
    setIntegBusy(p);
    try {
      const { url } = await api.connectUrl(p);
      window.location.href = url; // full redirect to GitHub / Google consent screen
    } catch (err) {
      fail(err);
      setIntegBusy(null);
    }
  };

  const disconnectIntegration = async (p: IntegrationKey) => {
    setIntegBusy(p);
    try {
      await api.disconnectIntegration(p);
      toast('success', `${p === 'github' ? 'GitHub' : 'Google Calendar'} disconnected`);
      loadIntegrations();
    } catch (err) {
      fail(err);
    } finally {
      setIntegBusy(null);
    }
  };

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast('error', 'Could not copy — select and copy it manually');
    }
  };

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      const ws = await api.joinWorkspace(joinCode.trim());
      upsertWorkspace(ws);
      setActiveWorkspaceId(ws.id);
      setJoinCode('');
      toast('success', `Joined ${ws.name}`);
    } catch (err) {
      fail(err);
    } finally {
      setJoining(false);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setCreating(true);
    try {
      const ws = await api.createWorkspace(newWsName.trim());
      upsertWorkspace(ws);
      setNewWsName('');
      toast('success', `Created ${ws.name}`);
    } catch (err) {
      fail(err);
    } finally {
      setCreating(false);
    }
  };

  const regenerate = async (ws: Workspace) => {
    if (!confirm(`Generate a new invite code for "${ws.name}"? The current code and links will stop working.`)) return;
    try {
      upsertWorkspace(await api.regenerateInviteCode(ws.id));
      toast('success', 'New invite code generated');
    } catch (err) {
      fail(err);
    }
  };

  const leave = async (ws: Workspace) => {
    if (!confirm(`Leave "${ws.name}"? You'll need an invite code to rejoin.`)) return;
    try {
      await api.leaveWorkspace(ws.id);
      removeWorkspace(ws.id);
      toast('success', `You left ${ws.name}`);
    } catch (err) {
      fail(err);
    }
  };

  const open = (ws: Workspace) => {
    setActiveWorkspaceId(ws.id);
    navigate('/app');
  };

  const integrationMeta: Record<IntegrationKey, { title: string; icon: React.ReactNode; blurb: string }> = {
    github: {
      title: 'GitHub',
      icon: <GithubIcon className="h-7 w-7" />,
      blurb: 'Pick a repository per workspace and Syncro pulls real commits into the feed and activity ledger.',
    },
    google: {
      title: 'Google Calendar',
      icon: <Calendar className="h-7 w-7" />,
      blurb: 'See your meetings on the workspace calendar and add team events to your Google Calendar.',
    },
  };

  const connectedCount = integrations?.filter((i) => i.connected && !i.needsReconnect).length ?? 0;

  return (
    <div className="relative min-h-screen bg-white font-sans text-zinc-900 antialiased transition-colors duration-300 selection:bg-black selection:text-white dark:bg-black dark:text-zinc-100 dark:selection:bg-white dark:selection:text-black">
      <AppBackdrop />
      <AppHeader />

      <main className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:gap-5">
        {/* ================= IDENTITY ================= */}
        <Bento className="fade-up lg:col-span-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative">
              <Avatar name={user.name} size="xl" className="!h-24 !w-24 !text-3xl" />
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-zinc-50 bg-emerald-500 dark:border-zinc-950">
                <Check className="h-3.5 w-3.5 stroke-[3] text-white" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-black dark:text-zinc-300">
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> Your profile
              </span>
              <h1 className="truncate text-3xl font-extrabold tracking-tight text-black dark:text-white sm:text-4xl">{user.name}</h1>
              <p className="truncate text-base text-zinc-500 dark:text-zinc-400">{user.email}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { k: 'Member since', v: new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) },
              { k: 'Workspaces', v: workspaces.length },
              { k: 'Connected apps', v: `${connectedCount}/2` },
            ].map((s) => (
              <div key={s.k} className={`${wellCls} px-4 py-3`}>
                <div className="text-xs font-medium text-zinc-500">{s.k}</div>
                <div className="mt-0.5 truncate text-xl font-bold tabular-nums text-black dark:text-white">{s.v}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/app" className={primaryBtn}>
              <LayoutDashboard className="h-4 w-4" /> Open workspace
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className={`${ghostBtn} hover:!border-red-500/40 hover:!text-red-500`}
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </Bento>

        {/* ================= ACCOUNT ================= */}
        <Bento className="fade-up flex flex-col lg:col-span-4" style={{ animationDelay: '60ms' }}>
          <BentoHeader icon={<UserIcon className="h-5 w-5" />} title="Account" subtitle="How teammates see you" />
          <form onSubmit={saveName} className="flex flex-1 flex-col gap-4">
            <div>
              <label className={labelCls}>Display name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} maxLength={80} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input value={user.email} disabled className={`${inputCls} cursor-not-allowed opacity-60`} />
            </div>
            <button type="submit" disabled={savingName || !name.trim() || name.trim() === user.name} className={`${primaryBtn} mt-auto`}>
              {savingName && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
            </button>
          </form>
        </Bento>

        {/* ================= INTEGRATIONS ================= */}
        {(['github', 'google'] as IntegrationKey[]).map((key, i) => {
          const meta = integrationMeta[key];
          const st = integrations?.find((x) => x.provider === key);
          const state = !integrations
            ? 'loading'
            : st && !st.configured
            ? 'unconfigured'
            : st?.needsReconnect
            ? 'reconnect'
            : st?.connected
            ? 'connected'
            : 'disconnected';
          const pill = {
            loading: { label: 'Checking…', cls: 'border-black/10 text-zinc-500 dark:border-white/10' },
            unconfigured: { label: 'Not set up', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' },
            reconnect: { label: 'Needs reconnect', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' },
            connected: { label: 'Connected', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
            disconnected: { label: 'Not connected', cls: 'border-black/10 bg-white text-zinc-500 dark:border-white/10 dark:bg-black' },
          }[state];
          return (
            <Bento key={key} className="fade-up flex flex-col lg:col-span-4" style={{ animationDelay: `${120 + i * 60}ms` }}>
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white shadow-lg dark:bg-white dark:text-black">
                  {meta.icon}
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${pill.cls}`}>
                  {state === 'connected' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}
                  {pill.label}
                </span>
              </div>
              <h2 className="text-lg font-bold text-black dark:text-white">{meta.title}</h2>
              {st?.connected && st.accountLabel && <p className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-300">{st.accountLabel}</p>}
              <p className="mb-5 mt-2 flex-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{meta.blurb}</p>

              {state === 'loading' ? (
                <div className="h-10 animate-pulse rounded-xl bg-black/[0.05] dark:bg-white/[0.06]" />
              ) : state === 'unconfigured' ? (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-200">
                  Add the {meta.title} OAuth keys to the backend <code className="font-mono">.env</code> to enable this.
                </p>
              ) : state === 'reconnect' ? (
                <div className="space-y-2">
                  <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-200">
                    Calendar permission is missing. On Google's screen, <b>tick the calendar checkbox</b>.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => connect(key)} disabled={integBusy === key} className={`${primaryBtn} flex-1`}>
                      {integBusy === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Reconnect
                    </button>
                    <button onClick={() => disconnectIntegration(key)} disabled={integBusy === key} className={ghostBtn}>
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : state === 'connected' ? (
                <button onClick={() => disconnectIntegration(key)} disabled={integBusy === key} className={ghostBtn}>
                  {integBusy === key && <Loader2 className="h-4 w-4 animate-spin" />} Disconnect
                </button>
              ) : (
                <button onClick={() => connect(key)} disabled={integBusy === key} className={primaryBtn}>
                  {integBusy === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  Connect {meta.title}
                </button>
              )}
            </Bento>
          );
        })}

        {/* ================= SECURITY ================= */}
        <Bento className="fade-up flex flex-col lg:col-span-4" style={{ animationDelay: '240ms' }}>
          <BentoHeader icon={<Shield className="h-5 w-5" />} title="Security" subtitle="Change your password" />
          <form onSubmit={changePassword} className="flex flex-1 flex-col gap-4">
            <div>
              <label className={labelCls}>Current password</label>
              <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>New password</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className={inputCls}
              />
            </div>
            <button type="submit" disabled={savingPw || !currentPw || newPw.length < 8} className={`${primaryBtn} mt-auto`}>
              {savingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Change password
            </button>
          </form>
        </Bento>

        {/* ================= WORKSPACES ================= */}
        <Bento className="fade-up lg:col-span-8" style={{ animationDelay: '300ms' }}>
          <BentoHeader
            icon={<Users className="h-5 w-5" />}
            title="Workspaces"
            subtitle="Share an invite code so friends can join"
          />
          <div className="space-y-3">
            {workspaces.map((ws) => {
              const link = ws.inviteCode ? `${window.location.origin}/join/${ws.inviteCode}` : '';
              const isAdmin = ws.role === 'OWNER' || ws.role === 'ADMIN';
              const active = ws.id === activeWorkspace?.id;
              return (
                <div
                  key={ws.id}
                  className={`rounded-2xl border bg-white p-4 transition dark:bg-black/50 ${
                    active ? 'border-emerald-500/40 shadow-[0_0_0_3px_rgba(16,185,129,0.08)]' : 'border-black/[0.07] hover:border-black/20 dark:border-white/[0.07] dark:hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar name={ws.name} size="md" className="!rounded-xl !ring-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-semibold text-black dark:text-white">{ws.name}</span>
                        <span className={`rounded-lg border px-2 py-0.5 text-xs font-semibold ${ROLE_STYLE[ws.role]}`}>{ws.role.toLowerCase()}</span>
                        {active && (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-zinc-500">
                        {ws.memberCount} member{ws.memberCount === 1 ? '' : 's'}
                        {ws.repoFullName && (
                          <>
                            {' · '}
                            <span className="font-mono">{ws.repoFullName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button onClick={() => open(ws)} className={ghostBtn}>
                      Open
                    </button>
                    {ws.role !== 'OWNER' && (
                      <button onClick={() => leave(ws)} className={`${ghostBtn} !px-2.5 hover:!border-red-500/40 hover:!text-red-500`} title="Leave workspace">
                        <DoorOpen className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {ws.inviteCode && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-black/15 bg-zinc-50 px-3 py-2.5 dark:border-white/15 dark:bg-zinc-950">
                      <span className="text-sm text-zinc-500">Invite code</span>
                      <code className="rounded-lg border border-black/10 bg-white px-2.5 py-1 font-mono text-base font-bold tracking-widest text-black dark:border-white/10 dark:bg-black dark:text-white">
                        {ws.inviteCode}
                      </code>
                      <div className="ml-auto flex flex-wrap gap-2">
                        <button onClick={() => copy(ws.inviteCode!, `code-${ws.id}`)} className={`${ghostBtn} !py-1.5`}>
                          {copied === `code-${ws.id}` ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />} Code
                        </button>
                        <button onClick={() => copy(link, `link-${ws.id}`)} className={`${ghostBtn} !py-1.5`}>
                          {copied === `link-${ws.id}` ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />} Link
                        </button>
                        {isAdmin && (
                          <button onClick={() => regenerate(ws)} className={`${ghostBtn} !px-2.5 !py-1.5`} title="Generate a new code">
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Bento>

        {/* ================= JOIN / CREATE ================= */}
        <Bento className="fade-up flex flex-col gap-6 lg:col-span-4" style={{ animationDelay: '360ms' }}>
          <form onSubmit={join}>
            <BentoHeader icon={<UserPlus className="h-5 w-5" />} title="Join a workspace" subtitle="Got a code from a friend?" />
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABCD-1234"
                className={`${inputCls} font-mono tracking-widest`}
                maxLength={12}
              />
              <button type="submit" disabled={joining || !joinCode.trim()} className={primaryBtn}>
                {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join'}
              </button>
            </div>
          </form>
          <div className="h-px bg-black/10 dark:bg-white/10" />
          <form onSubmit={create}>
            <BentoHeader icon={<Plus className="h-5 w-5" />} title="New workspace" subtitle="Start fresh for another team" />
            <div className="flex gap-2">
              <input value={newWsName} onChange={(e) => setNewWsName(e.target.value)} placeholder="e.g. Hackathon team" className={inputCls} maxLength={80} />
              <button type="submit" disabled={creating || !newWsName.trim()} className={primaryBtn}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </button>
            </div>
          </form>
        </Bento>
      </main>
    </div>
  );
};

export default ProfilePage;
