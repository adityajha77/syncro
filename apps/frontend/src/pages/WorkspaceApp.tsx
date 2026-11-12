import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Filter,
  Flame,
  GitBranch,
  GitCommit,
  Layers,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  UserPlus,
  Users,
  Video,
} from 'lucide-react';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../hooks/useRealtime';
import { Avatar, GithubIcon, Modal, ghostBtn, inputCls, labelCls, primaryBtn, useToast } from '../components/ui';
import type {
  ActivityRecord,
  ActivityType,
  CalendarEvent,
  Commit,
  EventCategory,
  GithubRepo,
  GoogleEvent,
  IntegrationStatus,
  Member,
  Task,
  TaskPriority,
  TaskStatus,
  WSMessage,
  Workspace,
} from '../types';

// ==========================================
// HELPERS
// ==========================================
/** Local YYYY-MM-DD (not UTC — avoids "overdue" flipping at midnight UTC). */
const localDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function timeAgo(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

const dueStr = (t: Task) => (t.dueDate ? t.dueDate.slice(0, 10) : ''); // stored as UTC midnight of chosen day
const isOverdue = (t: Task, today: string) => t.status !== 'DONE' && !!t.dueDate && dueStr(t) < today;
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const upsert = <T extends { id: string }>(list: T[], item: T, prepend = true) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : prepend ? [item, ...list] : [...list, item];

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  URGENT: 'bg-red-500/15 text-red-300 border-red-500/30',
  HIGH: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  MEDIUM: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  LOW: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
};
const STATUS_STYLE: Record<TaskStatus, string> = {
  TODO: 'border-zinc-700 bg-zinc-900 text-zinc-300',
  IN_PROGRESS: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  DONE: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
};
const CATEGORY_STYLE: Record<EventCategory, string> = {
  STANDUP: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  REVIEW: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  DEADLINE: 'bg-red-500/15 text-red-300 border-red-500/30',
  SYNC: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};
const ACTIVITY_DOT: Partial<Record<ActivityType, string>> = {
  TASK_COMPLETED: 'bg-emerald-400',
  TASK_CREATED: 'bg-sky-400',
  TASK_DELETED: 'bg-red-400',
  COMMIT_PUSHED: 'bg-violet-400',
  COMMITS_SYNCED: 'bg-violet-400',
  EVENT_SCHEDULED: 'bg-amber-400',
  MEMBER_JOINED: 'bg-pink-400',
};

const panel = 'rounded-2xl border border-zinc-800 bg-[#12141d]/90 shadow-lg';

// ==========================================
// WORKSPACE SWITCHER
// ==========================================
const WorkspaceSwitcher: React.FC<{ onJoin: () => void; onCreate: () => void }> = ({ onJoin, onCreate }) => {
  const { workspaces, activeWorkspace, setActiveWorkspaceId } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  if (!activeWorkspace) return null;
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 py-1.5 pl-1.5 pr-3 text-left transition hover:border-zinc-700"
      >
        <Avatar name={activeWorkspace.name} size="xs" className="rounded-lg" />
        <span className="max-w-[160px] truncate text-sm font-semibold text-white">{activeWorkspace.name}</span>
        <ChevronDown className={`h-4 w-4 text-zinc-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="modal-in absolute left-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-800 bg-[#13151f] shadow-2xl">
          <div className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Your workspaces</div>
          <div className="max-h-64 overflow-y-auto p-1.5">
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  setActiveWorkspaceId(w.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-zinc-800/70"
              >
                <Avatar name={w.name} size="xs" className="rounded-lg" />
                <span className="flex-1 truncate text-zinc-200">{w.name}</span>
                <span className="text-xs text-zinc-500">{w.role.toLowerCase()}</span>
                {w.id === activeWorkspace.id && <Check className="h-4 w-4 text-violet-400" />}
              </button>
            ))}
          </div>
          <div className="border-t border-zinc-800 p-1.5">
            <button
              onClick={() => {
                setOpen(false);
                onJoin();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-zinc-200 hover:bg-zinc-800/70"
            >
              <UserPlus className="h-4 w-4 text-zinc-400" /> Join with invite code
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onCreate();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-zinc-200 hover:bg-zinc-800/70"
            >
              <Plus className="h-4 w-4 text-zinc-400" /> Create workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// MAIN DASHBOARD
// ==========================================
export const WorkspaceApp: React.FC = () => {
  const { user, token, activeWorkspace: workspace, upsertWorkspace, setActiveWorkspaceId, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const workspaceId = workspace?.id ?? null;
  const isAdmin = workspace?.role === 'OWNER' || workspace?.role === 'ADMIN';
  const canWrite = workspace?.role !== 'VIEWER';

  // ---------- data ----------
  const [tasks, setTasks] = useState<Task[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);

  const github = integrations.find((i) => i.provider === 'github');
  const google = integrations.find((i) => i.provider === 'google');
  /** Connected AND has calendar permission — only then call Google. */
  const googleReady = !!google?.connected && !google.needsReconnect;

  // ---------- ui state ----------
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL' | 'OVERDUE'>('ALL');
  const [modal, setModal] = useState<null | 'task' | 'commit' | 'repo' | 'event' | 'invite' | 'join' | 'create'>(null);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const fail = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401 && /authentication required|account no longer/i.test(err.message)) {
        logout(); // session token expired/invalid
        navigate('/login?next=/app', { replace: true });
        return;
      }
      toast('error', err instanceof Error ? err.message : 'Something went wrong');
    },
    [toast, logout, navigate]
  );

  const markFresh = (id: string) => {
    setFreshIds((s) => new Set(s).add(id));
    setTimeout(() => setFreshIds((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    }), 1700);
  };

  // ---------- loading ----------
  const loadWorkspace = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [t, c, a, m] = await Promise.all([
        api.tasks(workspaceId),
        api.commits(workspaceId),
        api.activities(workspaceId, 40),
        api.members(workspaceId),
      ]);
      setTasks(t);
      setCommits(c);
      setActivities(a);
      setMembers(m);
    } catch (err) {
      fail(err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, fail]);

  const monthRange = useMemo(() => {
    const from = new Date(month.getFullYear(), month.getMonth(), 1);
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [month]);

  const loadCalendar = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setEvents(await api.events(workspaceId, monthRange));
    } catch (err) {
      fail(err);
    }
  }, [workspaceId, monthRange, fail]);

  const loadGoogle = useCallback(async () => {
    if (!googleReady) return setGoogleEvents([]);
    try {
      setGoogleEvents(await api.googleEvents(monthRange));
    } catch (err) {
      setGoogleEvents([]);
      fail(err);
    }
  }, [googleReady, monthRange, fail]);

  useEffect(() => {
    setLoading(true);
    void loadWorkspace();
  }, [loadWorkspace]);
  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);
  useEffect(() => {
    void loadGoogle();
  }, [loadGoogle]);
  useEffect(() => {
    api.integrations().then(setIntegrations).catch(() => setIntegrations([]));
  }, []);

  // ---------- realtime ----------
  const handleRealtime = useCallback(
    (msg: WSMessage) => {
      const data = msg.data as { id: string };
      switch (msg.event) {
        case 'TASK_CREATED':
          markFresh(data.id);
          setTasks((p) => upsert(p, msg.data as Task));
          break;
        case 'TASK_UPDATED':
          setTasks((p) => upsert(p, msg.data as Task));
          break;
        case 'TASK_DELETED':
          setTasks((p) => p.filter((t) => t.id !== data.id));
          break;
        case 'COMMIT_CREATED':
          markFresh(data.id);
          setCommits((p) => upsert(p, msg.data as Commit).sort((a, b) => b.committedAt.localeCompare(a.committedAt)).slice(0, 50));
          break;
        case 'EVENT_CREATED':
          setEvents((p) => upsert(p, msg.data as CalendarEvent, false).sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
          break;
        case 'EVENT_DELETED':
          setEvents((p) => p.filter((e) => e.id !== data.id));
          break;
        case 'WORKSPACE_UPDATED':
          upsertWorkspace(msg.data as Workspace);
          break;
        case 'MEMBER_JOINED': {
          const m = msg.data as Member;
          setMembers((p) => upsert(p, { ...m, online: true }, false));
          if (m.id !== user?.id) toast('success', `${m.name} joined the workspace`);
          break;
        }
        case 'ACTIVITY_RECORDED':
          markFresh(data.id);
          setActivities((p) => upsert(p, msg.data as ActivityRecord).slice(0, 40));
          break;
      }
    },
    [upsertWorkspace, toast, user?.id]
  );

  const { status: realtimeStatus, presence, updatePresence } = useRealtime(token, workspaceId, handleRealtime);

  // Re-sync after (re)connecting so nothing missed while offline is lost.
  useEffect(() => {
    if (realtimeStatus === 'connected') void loadWorkspace();
  }, [realtimeStatus, loadWorkspace]);

  // ---------- derived ----------
  const today = localDateStr(new Date());
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'DONE').length;
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const overdue = tasks.filter((t) => isOverdue(t, today)).length;
  const completionRate = total ? Math.round((done / total) * 100) : 0;
  const healthScore = total ? Math.max(0, Math.min(100, Math.round(completionRate * 0.7 + Math.max(0, 100 - overdue * 25) * 0.3))) : 100;
  const healthColor = healthScore >= 70 ? 'from-emerald-400 to-teal-400' : healthScore >= 40 ? 'from-amber-400 to-orange-400' : 'from-red-500 to-rose-400';

  const filteredTasks = tasks.filter((t) =>
    statusFilter === 'ALL' ? true : statusFilter === 'OVERDUE' ? isOverdue(t, today) : t.status === statusFilter
  );

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDow = month.getDay();
  const dayHas = (day: number) => {
    const d = new Date(month.getFullYear(), month.getMonth(), day);
    return {
      team: events.some((e) => sameDay(new Date(e.startsAt), d)),
      google: googleEvents.some((e) => sameDay(new Date(e.allDay ? `${e.startsAt}T00:00` : e.startsAt), d)),
    };
  };
  const dayTeamEvents = events.filter((e) => sameDay(new Date(e.startsAt), selectedDate));
  const dayGoogleEvents = googleEvents.filter((e) => sameDay(new Date(e.allDay ? `${e.startsAt}T00:00` : e.startsAt), selectedDate));

  // ---------- actions ----------
  const updateStatus = async (id: string, status: TaskStatus) => {
    if (!workspaceId) return;
    const prev = tasks;
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      const t = await api.updateTask(workspaceId, id, { status });
      setTasks((p) => upsert(p, t));
      if (status === 'DONE') toast('success', 'Nice! Task completed 🎉');
    } catch (err) {
      setTasks(prev);
      fail(err);
    }
  };

  const deleteTask = async (id: string) => {
    if (!workspaceId) return;
    const prev = tasks;
    setTasks((p) => p.filter((t) => t.id !== id));
    try {
      await api.deleteTask(workspaceId, id);
    } catch (err) {
      setTasks(prev);
      fail(err);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!workspaceId) return;
    const prev = events;
    setEvents((p) => p.filter((e) => e.id !== id));
    try {
      await api.deleteEvent(workspaceId, id);
      if (prev.find((e) => e.id === id)?.googleEventId) void loadGoogle();
    } catch (err) {
      setEvents(prev);
      fail(err);
    }
  };

  const syncNow = async () => {
    if (!workspaceId) return;
    setSyncing(true);
    try {
      const r = await api.syncCommits(workspaceId);
      upsertWorkspace({ ...workspace!, githubSyncedAt: r.syncedAt });
      toast('success', r.added ? `Synced ${r.added} new commit${r.added === 1 ? '' : 's'}` : 'Already up to date');
    } catch (err) {
      fail(err);
    } finally {
      setSyncing(false);
    }
  };

  // ---------- render ----------
  if (!workspace || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#08090d] px-4 text-center text-zinc-300">
        <p className="text-lg">You're not in any workspace yet.</p>
        <Link to="/profile" className={primaryBtn}>
          Create or join one
        </Link>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Tasks', value: total, hint: 'In the backlog', icon: <CheckSquare className="h-4 w-4" />, tint: 'text-sky-300 bg-sky-500/10' },
    { label: 'In Progress', value: inProgress, hint: 'Being worked on', icon: <Clock className="h-4 w-4" />, tint: 'text-amber-300 bg-amber-500/10' },
    { label: 'Completed', value: done, hint: `${completionRate}% finished`, icon: <CheckCircle2 className="h-4 w-4" />, tint: 'text-emerald-300 bg-emerald-500/10' },
    { label: 'Overdue', value: overdue, hint: 'Missed deadline', icon: <AlertTriangle className="h-4 w-4" />, tint: overdue ? 'text-red-300 bg-red-500/10' : 'text-zinc-400 bg-zinc-500/10' },
  ];

  return (
    <div className="min-h-screen bg-[#08090d] font-sans text-zinc-100 antialiased selection:bg-violet-500/30">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-80 bg-gradient-to-b from-violet-600/[0.07] via-indigo-500/[0.04] to-transparent" />

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-[#0c0d13]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/" title="Syncro home" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-950 shadow-sm transition hover:scale-105">
              <Layers className="h-5 w-5" />
            </Link>
            <WorkspaceSwitcher onJoin={() => setModal('join')} onCreate={() => setModal('create')} />
            <span className="hidden items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-300 sm:flex">
              <span
                className={`h-2 w-2 rounded-full ${
                  realtimeStatus === 'connected' ? 'bg-emerald-400' : realtimeStatus === 'connecting' ? 'animate-pulse bg-amber-400' : 'bg-red-400'
                }`}
              />
              {realtimeStatus === 'connected' ? 'Live' : realtimeStatus === 'connecting' ? 'Connecting' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden -space-x-2 sm:flex" title={`${presence.length} online`}>
              {presence.slice(0, 5).map((p) => (
                <Avatar
                  key={p.userId}
                  name={p.name}
                  size="sm"
                  online
                  title={`${p.name}${p.typing ? ' · typing…' : p.viewing ? ` · ${p.viewing}` : ''}`}
                />
              ))}
              {presence.length > 5 && <span className="pl-3 text-xs text-zinc-400">+{presence.length - 5}</span>}
            </div>
            {workspace.inviteCode && (
              <button onClick={() => setModal('invite')} className={ghostBtn}>
                <UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">Invite</span>
              </button>
            )}
            <Link to="/profile" title="Profile & integrations" className="transition hover:scale-105">
              <Avatar name={user.name} size="md" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* Greeting */}
        <div className="fade-up flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {user.name.split(' ')[0]} 👋
            </h1>
            <p className="mt-1 text-base text-zinc-400">
              {overdue
                ? `${overdue} task${overdue === 1 ? ' is' : 's are'} overdue — let's clear ${overdue === 1 ? 'it' : 'them'}.`
                : total
                ? `${inProgress} in progress, ${done} done. Keep the momentum going.`
                : 'Your board is fresh. Add the first task to get started.'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Users className="h-4 w-4" /> {members.length} member{members.length === 1 ? '' : 's'} · {presence.length} online
          </div>
        </div>

        {/* ================= KPIs ================= */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {kpis.map((k, i) => (
            <div key={k.label} className={`${panel} fade-up p-5 transition hover:-translate-y-0.5 hover:border-zinc-700`} style={{ animationDelay: `${i * 50}ms` }}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-400">{k.label}</span>
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${k.tint}`}>{k.icon}</span>
              </div>
              <div className="text-3xl font-bold text-white">{loading ? '–' : k.value}</div>
              <div className="mt-1 text-sm text-zinc-500">{k.hint}</div>
            </div>
          ))}
          <div className={`${panel} fade-up col-span-2 p-5 lg:col-span-1`} style={{ animationDelay: '200ms' }}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-400">Sprint Health</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10 text-pink-300">
                <Flame className="h-4 w-4" />
              </span>
            </div>
            <div className="text-3xl font-bold text-white">{healthScore}%</div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className={`h-full rounded-full bg-gradient-to-r ${healthColor} transition-all duration-700`} style={{ width: `${healthScore}%` }} />
            </div>
          </div>
        </div>

        {/* ================= COCKPIT ================= */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ---------- TASK BOARD ---------- */}
          <section className="space-y-4 lg:col-span-7">
            <div className={`${panel} flex flex-wrap items-center justify-between gap-3 p-5`}>
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <CheckSquare className="h-5 w-5 text-sky-300" /> Sprint Deliverables
                </h2>
                <p className="text-sm text-zinc-400">Track deliverables, priorities and owners</p>
              </div>
              {canWrite && (
                <button onClick={() => setModal('task')} className={primaryBtn}>
                  <Plus className="h-4 w-4" /> Add Task
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div className="flex flex-wrap items-center gap-1.5">
                <Filter className="h-4 w-4 text-zinc-500" />
                {(['ALL', 'TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                      statusFilter === f ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    {f.replace('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                  </button>
                ))}
              </div>
              <span className="text-zinc-500">{filteredTasks.length} tasks</span>
            </div>

            <div className="space-y-3">
              {loading ? (
                [0, 1, 2].map((i) => <div key={i} className={`${panel} h-32 animate-pulse`} />)
              ) : filteredTasks.length === 0 ? (
                <div className={`${panel} p-12 text-center`}>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300">
                    <CheckSquare className="h-6 w-6" />
                  </div>
                  <h3 className="mb-1 text-base font-semibold text-zinc-200">{tasks.length ? 'Nothing in this view' : 'Your board is empty'}</h3>
                  <p className="mx-auto mb-4 max-w-sm text-sm text-zinc-500">
                    {tasks.length ? 'No tasks match the active filter.' : 'Add the first deliverable for your team.'}
                  </p>
                  {!tasks.length && canWrite && (
                    <button onClick={() => setModal('task')} className={primaryBtn}>
                      Create first task
                    </button>
                  )}
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const late = isOverdue(task, today);
                  return (
                    <article
                      key={task.id}
                      className={`${panel} group p-5 transition hover:-translate-y-0.5 hover:border-zinc-700 ${freshIds.has(task.id) ? 'flash-in' : ''} ${
                        task.status === 'DONE' ? 'opacity-75' : ''
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs font-medium text-zinc-300">
                          {task.label || 'General'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${PRIORITY_STYLE[task.priority]}`}>{task.priority}</span>
                          {canWrite && (
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="rounded p-1 text-zinc-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
                              title="Delete task"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <h3 className={`text-base font-semibold ${task.status === 'DONE' ? 'text-zinc-400 line-through' : 'text-zinc-100'}`}>{task.title}</h3>
                      {task.description && <p className="mt-1 text-sm leading-relaxed text-zinc-400">{task.description}</p>}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-3">
                        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                          <span className="flex items-center gap-2">
                            {task.assignee ? <Avatar name={task.assignee.name} size="xs" /> : null}
                            <span className="text-zinc-300">{task.assignee?.name ?? 'Unassigned'}</span>
                          </span>
                          {task.dueDate && (
                            <span
                              className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${
                                late ? 'bg-red-500/15 font-semibold text-red-300' : 'bg-zinc-900 text-zinc-400'
                              }`}
                            >
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(`${dueStr(task)}T00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              {late && ' · overdue'}
                            </span>
                          )}
                        </div>
                        <select
                          value={task.status}
                          disabled={!canWrite}
                          onChange={(e) => updateStatus(task.id, e.target.value as TaskStatus)}
                          className={`cursor-pointer rounded-lg border px-2.5 py-1 text-sm font-medium focus:outline-none ${STATUS_STYLE[task.status]}`}
                        >
                          <option value="TODO">To do</option>
                          <option value="IN_PROGRESS">In progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* ---------- RIGHT COLUMN ---------- */}
          <div className="space-y-6 lg:col-span-5">
            {/* GitHub */}
            <section className={`${panel} space-y-4 p-5`}>
              <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-zinc-950">
                    <GithubIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-white">GitHub Activity</h2>
                    {workspace.repoFullName ? (
                      <a
                        href={`https://github.com/${workspace.repoFullName}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 truncate font-mono text-sm text-zinc-400 hover:text-white"
                      >
                        {workspace.repoFullName}
                        <GitBranch className="ml-1 h-3.5 w-3.5" />
                        {workspace.defaultBranch}
                      </a>
                    ) : (
                      <p className="text-sm text-zinc-500">No repository connected</p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {workspace.repoFullName && github?.connected && canWrite && (
                    <button onClick={syncNow} disabled={syncing} className={`${ghostBtn} px-2.5`} title="Pull latest commits from GitHub">
                      <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => setModal('repo')} className={`${ghostBtn} px-2.5`} title="Configure repository">
                      <Settings className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {workspace.repoFullName && (
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>
                    {github?.connected
                      ? workspace.githubSyncedAt
                        ? `Synced ${timeAgo(workspace.githubSyncedAt)} · auto-syncs every 3 min`
                        : 'Waiting for first sync…'
                      : 'Connect GitHub in your profile to sync real commits'}
                  </span>
                  {canWrite && (
                    <button onClick={() => setModal('commit')} className="text-zinc-400 hover:text-white">
                      + Log manually
                    </button>
                  )}
                </div>
              )}

              <div className="max-h-[22rem] space-y-2 overflow-y-auto pr-1">
                {commits.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-800 bg-[#0a0b10] p-6 text-center">
                    <p className="mb-3 text-sm text-zinc-400">
                      {workspace.repoFullName ? 'No commits yet.' : 'Connect a repository to stream its commits here.'}
                    </p>
                    {!workspace.repoFullName && isAdmin && (
                      <button onClick={() => setModal('repo')} className={primaryBtn}>
                        <Link2 className="h-4 w-4" /> Connect repository
                      </button>
                    )}
                  </div>
                ) : (
                  commits.map((c) => {
                    const Wrapper: React.ElementType = c.url ? 'a' : 'div';
                    return (
                      <Wrapper
                        key={c.id}
                        {...(c.url && { href: c.url, target: '_blank', rel: 'noreferrer' })}
                        className={`block rounded-xl border border-zinc-800/80 bg-[#0a0b10] p-3 transition hover:border-zinc-700 ${freshIds.has(c.id) ? 'flash-in' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar name={c.author?.name ?? c.authorName} size="xs" className="mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm text-zinc-100">{c.message}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                              <span className="text-zinc-300">{c.author?.name ?? c.authorName}</span>
                              <span className="font-mono text-violet-300">{c.sha.slice(0, 7)}</span>
                              <span>{timeAgo(c.committedAt)}</span>
                              {c.source === 'MANUAL' && <span className="rounded bg-zinc-800 px-1.5">manual</span>}
                            </div>
                          </div>
                          {c.url && <ExternalLink className="h-3.5 w-3.5 shrink-0 text-zinc-600" />}
                        </div>
                      </Wrapper>
                    );
                  })
                )}
              </div>
            </section>

            {/* Calendar */}
            <section className={`${panel} space-y-4 p-5`}>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">Team Calendar</h2>
                    <p className="text-sm text-zinc-500">
                      {googleReady ? `+ Google · ${google!.accountLabel}` : 'Workspace events'}
                    </p>
                  </div>
                </div>
                {canWrite && (
                  <button onClick={() => setModal('event')} className={ghostBtn}>
                    <Plus className="h-4 w-4" /> Event
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-[#0a0b10] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white" aria-label="Previous month">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-semibold text-white">{month.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</span>
                  <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white" aria-label="Next month">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-500">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {Array.from({ length: firstDow }).map((_, i) => (
                    <div key={`b${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const d = new Date(month.getFullYear(), month.getMonth(), day);
                    const isToday = sameDay(d, new Date());
                    const isSel = sameDay(d, selectedDate);
                    const has = dayHas(day);
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(d)}
                        className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-lg transition ${
                          isSel ? 'bg-white font-bold text-zinc-950' : isToday ? 'border border-violet-400/60 font-semibold text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        {day}
                        <span className="absolute bottom-1 flex gap-0.5">
                          {has.team && <span className="h-1 w-1 rounded-full bg-violet-400" />}
                          {has.google && <span className="h-1 w-1 rounded-full bg-sky-400" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1 text-sm">
                  <span className="font-medium text-zinc-300">
                    {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-zinc-500">{dayTeamEvents.length + dayGoogleEvents.length} event(s)</span>
                </div>
                {dayTeamEvents.length + dayGoogleEvents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-800 bg-[#0a0b10] p-4 text-center text-sm text-zinc-500">Nothing scheduled.</div>
                ) : (
                  <>
                    {dayTeamEvents.map((ev) => (
                      <div key={ev.id} className="group rounded-xl border border-zinc-800 bg-[#0a0b10] p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`rounded-md border px-2 py-0.5 font-medium ${CATEGORY_STYLE[ev.category]}`}>{ev.category}</span>
                          <span className="flex items-center gap-1 text-zinc-400">
                            <Clock className="h-3.5 w-3.5" /> {fmtTime(ev.startsAt)}
                          </span>
                        </div>
                        <h4 className="mt-1.5 text-sm font-semibold text-zinc-100">{ev.title}</h4>
                        <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                          <span className="flex items-center gap-1 truncate">
                            <Video className="h-3.5 w-3.5" />
                            {ev.location && /^https?:\/\//.test(ev.location) ? (
                              <a href={ev.location} target="_blank" rel="noreferrer" className="truncate text-zinc-300 hover:text-white">
                                Join call
                              </a>
                            ) : (
                              ev.location || 'No location'
                            )}
                            {ev.googleEventId && <span className="ml-1 rounded bg-sky-500/15 px-1.5 text-sky-300">in Google</span>}
                          </span>
                          {canWrite && (
                            <button onClick={() => deleteEvent(ev.id)} className="text-zinc-600 opacity-0 transition hover:text-red-300 group-hover:opacity-100" title="Cancel event">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {dayGoogleEvents.map((ev) => (
                      <a
                        key={ev.id}
                        href={ev.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-3 transition hover:border-sky-500/40"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="rounded-md border border-sky-500/30 bg-sky-500/15 px-2 py-0.5 font-medium text-sky-300">GOOGLE</span>
                          <span className="flex items-center gap-1 text-zinc-400">
                            <Clock className="h-3.5 w-3.5" /> {ev.allDay ? 'All day' : fmtTime(ev.startsAt)}
                          </span>
                        </div>
                        <h4 className="mt-1.5 text-sm font-semibold text-zinc-100">{ev.title}</h4>
                        {ev.location && <p className="mt-1 truncate text-xs text-zinc-500">{ev.location}</p>}
                      </a>
                    ))}
                  </>
                )}
                {google?.needsReconnect ? (
                  <Link to="/profile" className="block rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-200 hover:bg-amber-500/15">
                    Google Calendar needs calendar permission — reconnect in your profile →
                  </Link>
                ) : (
                  !google?.connected && (
                    <Link to="/profile" className="block text-center text-xs text-zinc-500 hover:text-zinc-300">
                      Connect Google Calendar to see your meetings here →
                    </Link>
                  )
                )}
              </div>
            </section>

            {/* Activity ledger */}
            <section className={`${panel} space-y-4 p-5`}>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">Activity Ledger</h2>
                    <p className="text-sm text-zinc-500">Everything that happened, in one timeline</p>
                  </div>
                </div>
              </div>
              <ol className="relative max-h-96 space-y-4 overflow-y-auto pl-1 pr-1">
                {activities.length === 0 ? (
                  <li className="text-center text-sm text-zinc-500">No activity yet.</li>
                ) : (
                  activities.map((a) => (
                    <li key={a.id} className={`flex gap-3 rounded-lg ${freshIds.has(a.id) ? 'flash-in' : ''}`}>
                      <div className="relative">
                        <Avatar name={a.actor.name} size="xs" />
                        <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#12141d] ${ACTIVITY_DOT[a.type] ?? 'bg-zinc-500'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm leading-snug text-zinc-300">
                          <span className="font-semibold text-zinc-100">{a.actor.name}</span> {a.summary}
                        </p>
                        <span className="text-xs text-zinc-500">{timeAgo(a.createdAt)}</span>
                      </div>
                    </li>
                  ))
                )}
              </ol>
            </section>
          </div>
        </div>
      </main>

      {/* ================= MODALS ================= */}
      {modal === 'task' && (
        <TaskModal
          members={members}
          myId={user.id}
          onClose={() => setModal(null)}
          onTyping={(typing) => updatePresence({ typing, viewing: typing ? 'new task' : null })}
          onSubmit={async (payload) => {
            const t = await api.createTask(workspace.id, payload);
            setTasks((p) => upsert(p, t));
            markFresh(t.id);
            toast('success', 'Task created');
          }}
          onError={fail}
        />
      )}

      {modal === 'commit' && (
        <SimpleFormModal
          title="Log a commit manually"
          icon={<GitCommit className="h-5 w-5 text-violet-300" />}
          label="Commit message"
          placeholder="fix: resolve session expiration bug"
          submitLabel="Log commit"
          onClose={() => setModal(null)}
          onSubmit={async (message) => {
            const c = await api.createCommit(workspace.id, { message });
            setCommits((p) => upsert(p, c));
          }}
          onError={fail}
        />
      )}

      {modal === 'repo' && (
        <RepoModal
          workspace={workspace}
          githubConnected={!!github?.connected}
          githubConfigured={!!github?.configured}
          onClose={() => setModal(null)}
          onSaved={async (ws) => {
            upsertWorkspace(ws);
            setModal(null);
            toast('success', ws.repoFullName ? `Connected ${ws.repoFullName}` : 'Repository disconnected');
            if (ws.repoFullName && github?.connected) {
              setSyncing(true);
              try {
                const r = await api.syncCommits(ws.id);
                upsertWorkspace({ ...ws, githubSyncedAt: r.syncedAt });
                if (r.added) toast('success', `Imported ${r.added} commits`);
              } catch (err) {
                fail(err);
              } finally {
                setSyncing(false);
              }
            }
          }}
          onError={fail}
        />
      )}

      {modal === 'event' && (
        <EventModal
          defaultDate={selectedDate}
          googleConnected={googleReady}
          onClose={() => setModal(null)}
          onSubmit={async (payload) => {
            const ev = await api.createEvent(workspace.id, payload);
            setEvents((p) => upsert(p, ev, false).sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
            setSelectedDate(new Date(ev.startsAt));
            toast('success', payload.addToGoogle ? 'Event scheduled and added to Google Calendar' : 'Event scheduled');
            if (payload.addToGoogle) void loadGoogle();
          }}
          onError={fail}
        />
      )}

      {modal === 'invite' && workspace.inviteCode && <InviteModal workspace={workspace} onClose={() => setModal(null)} />}

      {modal === 'join' && (
        <SimpleFormModal
          title="Join a workspace"
          icon={<UserPlus className="h-5 w-5 text-pink-300" />}
          label="Invite code"
          placeholder="ABCD-1234"
          submitLabel="Join"
          mono
          onClose={() => setModal(null)}
          onSubmit={async (code) => {
            const ws = await api.joinWorkspace(code);
            upsertWorkspace(ws);
            setActiveWorkspaceId(ws.id);
            toast('success', `Welcome to ${ws.name}!`);
          }}
          onError={fail}
        />
      )}

      {modal === 'create' && (
        <SimpleFormModal
          title="Create a workspace"
          icon={<Plus className="h-5 w-5 text-emerald-300" />}
          label="Workspace name"
          placeholder="e.g. Hackathon team"
          submitLabel="Create"
          onClose={() => setModal(null)}
          onSubmit={async (name) => {
            const ws = await api.createWorkspace(name);
            upsertWorkspace(ws);
            setActiveWorkspaceId(ws.id);
            toast('success', `Created ${ws.name}`);
          }}
          onError={fail}
        />
      )}
    </div>
  );
};

// ==========================================
// MODALS
// ==========================================
const SubmitRow: React.FC<{ busy: boolean; label: string; onCancel: () => void; disabled?: boolean }> = ({ busy, label, onCancel, disabled }) => (
  <div className="flex items-center justify-end gap-2 pt-2">
    <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-white">
      Cancel
    </button>
    <button type="submit" disabled={busy || disabled} className={primaryBtn}>
      {busy && <Loader2 className="h-4 w-4 animate-spin" />} {label}
    </button>
  </div>
);

const SimpleFormModal: React.FC<{
  title: string;
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  submitLabel: string;
  mono?: boolean;
  onClose: () => void;
  onSubmit: (value: string) => Promise<void>;
  onError: (e: unknown) => void;
}> = ({ title, icon, label, placeholder, submitLabel, mono, onClose, onSubmit, onError }) => {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={title} icon={icon} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!value.trim()) return;
          setBusy(true);
          try {
            await onSubmit(value.trim());
            onClose();
          } catch (err) {
            onError(err);
          } finally {
            setBusy(false);
          }
        }}
        className="space-y-4"
      >
        <div>
          <label className={labelCls}>{label}</label>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(mono ? e.target.value.toUpperCase() : e.target.value)}
            placeholder={placeholder}
            className={`${inputCls} ${mono ? 'font-mono tracking-widest' : ''}`}
          />
        </div>
        <SubmitRow busy={busy} label={submitLabel} onCancel={onClose} disabled={!value.trim()} />
      </form>
    </Modal>
  );
};

const TaskModal: React.FC<{
  members: Member[];
  myId: string;
  onClose: () => void;
  onTyping: (typing: boolean) => void;
  onSubmit: (p: { title: string; description?: string; priority: TaskPriority; dueDate: string | null; label?: string; assigneeId?: string | null }) => Promise<void>;
  onError: (e: unknown) => void;
}> = ({ members, myId, onClose, onTyping, onSubmit, onError }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [label, setLabel] = useState('Core Project');
  const [assignee, setAssignee] = useState(myId);
  const [due, setDue] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return localDateStr(d);
  });
  const [busy, setBusy] = useState(false);

  // Let teammates see "typing…" while this modal is open.
  useEffect(() => {
    onTyping(true);
    return () => onTyping(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal title="Create task" icon={<CheckSquare className="h-5 w-5 text-sky-300" />} onClose={onClose} wide>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) return;
          setBusy(true);
          try {
            await onSubmit({
              title: title.trim(),
              description: desc.trim() || undefined,
              priority,
              dueDate: due || null,
              label: label.trim() || undefined,
              assigneeId: assignee || null,
            });
            onClose();
          } catch (err) {
            onError(err);
          } finally {
            setBusy(false);
          }
        }}
        className="space-y-4"
      >
        <div>
          <label className={labelCls}>Title *</label>
          <input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Implement user authentication" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Acceptance criteria, links, notes…" className={`${inputCls} resize-none`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Project / label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Assignee</label>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={inputCls}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.id === myId ? ' (you)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className={inputCls}>
              {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => (
                <option key={p} value={p}>
                  {p[0] + p.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Due date</label>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inputCls} />
          </div>
        </div>
        <SubmitRow busy={busy} label="Save task" onCancel={onClose} disabled={!title.trim()} />
      </form>
    </Modal>
  );
};

const RepoModal: React.FC<{
  workspace: Workspace;
  githubConnected: boolean;
  githubConfigured: boolean;
  onClose: () => void;
  onSaved: (ws: Workspace) => void;
  onError: (e: unknown) => void;
}> = ({ workspace, githubConnected, githubConfigured, onClose, onSaved, onError }) => {
  const [repos, setRepos] = useState<GithubRepo[] | null>(null);
  const [query, setQuery] = useState('');
  const [repo, setRepo] = useState(workspace.repoFullName ?? '');
  const [branch, setBranch] = useState(workspace.defaultBranch);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (githubConnected) api.githubRepos().then(setRepos).catch((e) => { setRepos([]); onError(e); });
  }, [githubConnected, onError]);

  const save = async (repoFullName: string | null) => {
    setBusy(true);
    try {
      onSaved(await api.updateWorkspace(workspace.id, { repoFullName, defaultBranch: branch.trim() || 'main' }));
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  };

  const visible = (repos ?? []).filter((r) => r.fullName.toLowerCase().includes(query.toLowerCase()));

  return (
    <Modal title="Connect a repository" icon={<GithubIcon className="h-5 w-5" />} onClose={onClose} wide>
      {githubConnected ? (
        <div className="mb-4 space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your repositories…" className={`${inputCls} pl-9`} />
          </div>
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-zinc-800 bg-[#0a0b10] p-1.5">
            {repos === null ? (
              <div className="flex items-center justify-center gap-2 p-4 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading repositories…
              </div>
            ) : visible.length === 0 ? (
              <p className="p-4 text-center text-sm text-zinc-500">No repositories found.</p>
            ) : (
              visible.map((r) => (
                <button
                  key={r.fullName}
                  type="button"
                  onClick={() => {
                    setRepo(r.fullName);
                    setBranch(r.defaultBranch);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition ${
                    repo === r.fullName ? 'bg-violet-500/15 text-white' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <span className="flex-1 truncate font-mono">{r.fullName}</span>
                  {r.private && <span className="rounded bg-zinc-800 px-1.5 text-xs text-zinc-400">private</span>}
                  <span className="text-xs text-zinc-500">{timeAgo(r.pushedAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="mb-4 rounded-lg border border-sky-500/20 bg-sky-500/[0.06] p-3 text-sm text-sky-200">
          {githubConfigured ? (
            <>
              <Link to="/profile" className="font-semibold underline underline-offset-2">
                Connect GitHub
              </Link>{' '}
              to pick from your repos and sync real commits automatically.
            </>
          ) : (
            'GitHub sync is not set up on the server yet — you can still name the repo and log commits manually.'
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save(repo.trim() || null);
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className={labelCls}>Repository (owner/repo)</label>
            <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="your-username/project" className={`${inputCls} font-mono`} />
          </div>
          <div>
            <label className={labelCls}>Branch</label>
            <input value={branch} onChange={(e) => setBranch(e.target.value)} className={`${inputCls} font-mono`} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 pt-2">
          {workspace.repoFullName ? (
            <button type="button" onClick={() => save(null)} className="text-sm text-red-300/80 hover:text-red-300">
              Disconnect
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={busy || !repo.trim()} className={primaryBtn}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

const EventModal: React.FC<{
  defaultDate: Date;
  googleConnected: boolean;
  onClose: () => void;
  onSubmit: (p: { title: string; startsAt: string; category: EventCategory; location?: string; durationMinutes: number; addToGoogle: boolean }) => Promise<void>;
  onError: (e: unknown) => void;
}> = ({ defaultDate, googleConnected, onClose, onSubmit, onError }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('SYNC');
  const [date, setDate] = useState(localDateStr(defaultDate));
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(30);
  const [location, setLocation] = useState('');
  const [addToGoogle, setAddToGoogle] = useState(googleConnected);
  const [busy, setBusy] = useState(false);

  return (
    <Modal title="Schedule event" icon={<Calendar className="h-5 w-5 text-amber-300" />} onClose={onClose} wide>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) return;
          const [y, m, d] = date.split('-').map(Number);
          const [hh, mm] = time.split(':').map(Number);
          setBusy(true);
          try {
            await onSubmit({
              title: title.trim(),
              category,
              startsAt: new Date(y, m - 1, d, hh || 0, mm || 0).toISOString(),
              durationMinutes: duration,
              location: location.trim() || undefined,
              addToGoogle: googleConnected && addToGoogle,
            });
            onClose();
          } catch (err) {
            onError(err);
          } finally {
            setBusy(false);
          }
        }}
        className="space-y-4"
      >
        <div>
          <label className={labelCls}>Title *</label>
          <input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sprint retrospective" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Time</label>
            <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as EventCategory)} className={inputCls}>
              {(['STANDUP', 'REVIEW', 'DEADLINE', 'SYNC'] as const).map((c) => (
                <option key={c} value={c}>
                  {c[0] + c.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Duration</label>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputCls}>
              {[15, 30, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>
                  {m < 60 ? `${m} min` : `${m / 60} h`}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Location or meeting link</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="https://meet.google.com/…" className={inputCls} />
        </div>
        {googleConnected && (
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-sky-500/20 bg-sky-500/[0.05] px-3 py-2.5 text-sm text-sky-100">
            <input type="checkbox" checked={addToGoogle} onChange={(e) => setAddToGoogle(e.target.checked)} className="h-4 w-4 accent-sky-500" />
            Also add to my Google Calendar
          </label>
        )}
        <SubmitRow busy={busy} label="Schedule" onCancel={onClose} disabled={!title.trim()} />
      </form>
    </Modal>
  );
};

const InviteModal: React.FC<{ workspace: Workspace; onClose: () => void }> = ({ workspace, onClose }) => {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const link = `${window.location.origin}/join/${workspace.inviteCode}`;
  const copy = async (text: string, which: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard blocked — text is selectable */
    }
  };
  return (
    <Modal title={`Invite to ${workspace.name}`} icon={<UserPlus className="h-5 w-5 text-pink-300" />} onClose={onClose}>
      <p className="mb-4 text-sm text-zinc-400">Friends with a Syncro account can join using this code or link. They'll join as members.</p>
      <div className="mb-3 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/[0.06] p-5 text-center">
        <div className="mb-1 text-xs uppercase tracking-wider text-zinc-500">Invite code</div>
        <div className="select-all font-mono text-3xl font-bold tracking-[0.2em] text-white">{workspace.inviteCode}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => copy(workspace.inviteCode!, 'code')} className={ghostBtn}>
          {copied === 'code' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />} Copy code
        </button>
        <button onClick={() => copy(link, 'link')} className={primaryBtn}>
          {copied === 'link' ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} Copy invite link
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-zinc-500">
        Manage codes in your <Link to="/profile" className="text-zinc-300 underline-offset-2 hover:underline">profile</Link>.
      </p>
    </Modal>
  );
};

export default WorkspaceApp;
