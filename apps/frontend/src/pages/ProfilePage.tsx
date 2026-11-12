import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  KeyRound,
  Layers,
  Link2,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Shield,
  User as UserIcon,
  Users,
  DoorOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { IntegrationKey, IntegrationStatus, Workspace } from '../types';
import { Avatar, GithubIcon, ghostBtn, inputCls, labelCls, primaryBtn, useToast } from '../components/ui';

const card = 'rounded-2xl border border-zinc-800 bg-[#12141d]/90 p-6 shadow-lg';
const ROLE_STYLE: Record<string, string> = {
  OWNER: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  ADMIN: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  MEMBER: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  VIEWER: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
};

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div className="mb-5 flex items-start gap-3">
    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-200">{icon}</div>
    <div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {subtitle && <p className="text-sm text-zinc-400">{subtitle}</p>}
    </div>
  </div>
);

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
  useEffect(() => {
    const which = params.get('integration');
    if (!which) return;
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
      icon: <GithubIcon className="h-6 w-6" />,
      blurb: 'Pick a repository per workspace and Syncro pulls real commits into the feed and activity ledger.',
    },
    google: {
      title: 'Google Calendar',
      icon: <Calendar className="h-6 w-6" />,
      blurb: 'See your meetings on the workspace calendar and add team events to your Google Calendar.',
    },
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-zinc-100">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-violet-600/10 via-indigo-500/5 to-transparent" />

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-[#0c0d13]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/app" className="group inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to workspace
          </Link>
          <Link to="/" className="flex items-center gap-2 font-semibold text-white">
            <Layers className="h-5 w-5" /> Syncro
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {/* Identity hero */}
        <section className={`${card} fade-up flex flex-col items-start gap-5 sm:flex-row sm:items-center`}>
          <Avatar name={user.name} size="xl" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold text-white">{user.name}</h1>
            <p className="truncate text-base text-zinc-400">{user.email}</p>
            <p className="mt-1 text-sm text-zinc-500">
              Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} ·{' '}
              {workspaces.length} workspace{workspaces.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className={`${ghostBtn} hover:border-red-500/40 hover:text-red-300`}
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </section>

        {/* Connected accounts */}
        <section className={`${card} fade-up`}>
          <SectionTitle icon={<Link2 className="h-5 w-5" />} title="Connected accounts" subtitle="Bring your real work into Syncro." />
          <div className="grid gap-4 md:grid-cols-2">
            {(['github', 'google'] as IntegrationKey[]).map((key) => {
              const meta = integrationMeta[key];
              const st = integrations?.find((i) => i.provider === key);
              return (
                <div key={key} className="flex flex-col rounded-xl border border-zinc-800 bg-[#0a0b10] p-5 transition hover:border-zinc-700">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-950">{meta.icon}</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white">{meta.title}</div>
                      {st?.connected ? (
                        <div className="flex items-center gap-1.5 truncate text-sm text-emerald-400">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" /> {st.accountLabel}
                        </div>
                      ) : (
                        <div className="text-sm text-zinc-500">Not connected</div>
                      )}
                    </div>
                  </div>
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-zinc-400">{meta.blurb}</p>
                  {!integrations ? (
                    <div className="h-9 animate-pulse rounded-lg bg-zinc-900" />
                  ) : st && !st.configured ? (
                    <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                      Not set up on the server yet — add the {meta.title} OAuth keys to the backend <code>.env</code>.
                    </p>
                  ) : st?.connected ? (
                    <button onClick={() => disconnectIntegration(key)} disabled={integBusy === key} className={ghostBtn}>
                      {integBusy === key && <Loader2 className="h-4 w-4 animate-spin" />} Disconnect
                    </button>
                  ) : (
                    <button onClick={() => connect(key)} disabled={integBusy === key} className={primaryBtn}>
                      {integBusy === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                      Connect {meta.title}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Workspaces */}
        <section className={`${card} fade-up`}>
          <SectionTitle
            icon={<Users className="h-5 w-5" />}
            title="Workspaces"
            subtitle="Share an invite code with friends so they can join your workspace."
          />

          <div className="space-y-3">
            {workspaces.map((ws) => {
              const link = ws.inviteCode ? `${window.location.origin}/join/${ws.inviteCode}` : '';
              const isAdmin = ws.role === 'OWNER' || ws.role === 'ADMIN';
              return (
                <div
                  key={ws.id}
                  className={`rounded-xl border bg-[#0a0b10] p-4 transition ${
                    ws.id === activeWorkspace?.id ? 'border-violet-500/40 shadow-[0_0_0_1px_rgba(139,92,246,0.15)]' : 'border-zinc-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar name={ws.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-semibold text-white">{ws.name}</span>
                        <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${ROLE_STYLE[ws.role]}`}>{ws.role}</span>
                        {ws.id === activeWorkspace?.id && <span className="text-xs text-violet-300">Active</span>}
                      </div>
                      <div className="text-sm text-zinc-500">
                        {ws.memberCount} member{ws.memberCount === 1 ? '' : 's'}
                        {ws.repoFullName && <> · <span className="font-mono">{ws.repoFullName}</span></>}
                      </div>
                    </div>
                    <button onClick={() => open(ws)} className={ghostBtn}>
                      Open
                    </button>
                    {ws.role !== 'OWNER' && (
                      <button onClick={() => leave(ws)} className={`${ghostBtn} hover:border-red-500/40 hover:text-red-300`} title="Leave workspace">
                        <DoorOpen className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {ws.inviteCode && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-zinc-800 bg-black/20 px-3 py-2.5">
                      <span className="text-sm text-zinc-400">Invite code</span>
                      <code className="rounded-md bg-zinc-900 px-2.5 py-1 font-mono text-base font-semibold tracking-widest text-white">
                        {ws.inviteCode}
                      </code>
                      <div className="ml-auto flex flex-wrap gap-2">
                        <button onClick={() => copy(ws.inviteCode!, `code-${ws.id}`)} className={ghostBtn}>
                          {copied === `code-${ws.id}` ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />} Code
                        </button>
                        <button onClick={() => copy(link, `link-${ws.id}`)} className={ghostBtn}>
                          {copied === `link-${ws.id}` ? <Check className="h-4 w-4 text-emerald-400" /> : <Link2 className="h-4 w-4" />} Link
                        </button>
                        {isAdmin && (
                          <button onClick={() => regenerate(ws)} className={ghostBtn} title="Generate a new code">
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

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <form onSubmit={join} className="rounded-xl border border-zinc-800 bg-[#0a0b10] p-4">
              <label className={labelCls}>Join a friend's workspace</label>
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
            <form onSubmit={create} className="rounded-xl border border-zinc-800 bg-[#0a0b10] p-4">
              <label className={labelCls}>Create a new workspace</label>
              <div className="flex gap-2">
                <input value={newWsName} onChange={(e) => setNewWsName(e.target.value)} placeholder="e.g. Hackathon team" className={inputCls} maxLength={80} />
                <button type="submit" disabled={creating || !newWsName.trim()} className={primaryBtn}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Account */}
          <section className={`${card} fade-up`}>
            <SectionTitle icon={<UserIcon className="h-5 w-5" />} title="Account" />
            <form onSubmit={saveName} className="space-y-4">
              <div>
                <label className={labelCls}>Display name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} maxLength={80} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input value={user.email} disabled className={`${inputCls} cursor-not-allowed opacity-60`} />
              </div>
              <button type="submit" disabled={savingName || !name.trim() || name.trim() === user.name} className={primaryBtn}>
                {savingName && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
              </button>
            </form>
          </section>

          {/* Security */}
          <section className={`${card} fade-up`}>
            <SectionTitle icon={<Shield className="h-5 w-5" />} title="Security" />
            <form onSubmit={changePassword} className="space-y-4">
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
              <button type="submit" disabled={savingPw || !currentPw || newPw.length < 8} className={primaryBtn}>
                {savingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Change password
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
