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
import {
  AppBackdrop,
  Avatar,
  Bento,
  BentoHeader,
  GithubIcon,
  Modal,
  RingGauge,
  chipCls,
  ghostBtn,
  inputCls,
  labelCls,
  primaryBtn,
  useToast,
  wellCls,
} from '../components/ui';
import { AppHeader } from '../components/AppHeader';
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
  URGENT: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300',
  HIGH: 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-300',
  MEDIUM: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300',
  LOW: 'border-black/10 bg-zinc-100 text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300',
};
const STATUS_STYLE: Record<TaskStatus, string> = {
  TODO: 'border-black/10 bg-white text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300',
  IN_PROGRESS: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200',
  DONE: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
};
const CATEGORY_STYLE: Record<EventCategory, string> = {
  STANDUP: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300',
  REVIEW: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300',
  DEADLINE: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300',
  SYNC: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
};
const ACTIVITY_DOT: Partial<Record<ActivityType, string>> = {
  TASK_COMPLETED: 'bg-emerald-500',
  TASK_CREATED: 'bg-sky-500',
  TASK_DELETED: 'bg-red-500',
  COMMIT_PUSHED: 'bg-violet-500',
  COMMITS_SYNCED: 'bg-violet-500',
  EVENT_SCHEDULED: 'bg-amber-500',
  MEMBER_JOINED: 'bg-pink-500',
};
const ROLE_STYLE: Record<string, string> = {
  OWNER: 'text-violet-600 dark:text-violet-300',
  ADMIN: 'text-sky-600 dark:text-sky-300',
  MEMBER: 'text-zinc-500 dark:text-zinc-400',
  VIEWER: 'text-zinc-400 dark:text-zinc-500',
};

/** List row inside a bento tile. */
const rowCls =
  'rounded-2xl border border-black/[0.07] bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-black/20 dark:border-white/[0.07] dark:bg-black/50 dark:hover:border-white/20';
const iconBtn =
  'rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-black dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-white';

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
  const item = 'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900';
  return (
    <div className="relative min-w-0" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-black/10 bg-white py-1.5 pl-1.5 pr-2.5 text-left shadow-sm transition hover:border-black/25 dark:border-white/10 dark:bg-zinc-950 dark:hover:border-white/25"
      >
        <Avatar name={activeWorkspace.name} size="xs" className="!rounded-lg !ring-0" />
        <span className="min-w-0 max-w-[6.5rem] truncate text-sm font-semibold text-zinc-900 dark:text-white sm:max-w-[12rem]">{activeWorkspace.name}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="modal-in absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950">
          <div className="px-3.5 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Your workspaces</div>
          <div className="max-h-64 overflow-y-auto p-1.5">
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  setActiveWorkspaceId(w.id);
                  setOpen(false);
                }}
                className={item}
              >
                <Avatar name={w.name} size="xs" className="!rounded-lg !ring-0" />
                <span className="flex-1 truncate">{w.name}</span>
                <span className="text-xs text-zinc-400">{w.role.toLowerCase()}</span>
                {w.id === activeWorkspace.id && <Check className="h-4 w-4 text-emerald-500" />}
              </button>
            ))}
          </div>
          <div className="border-t border-black/10 p-1.5 dark:border-white/10">
            <button
              onClick={() => {
                setOpen(false);
                onJoin();
              }}
              className={item}
            >
              <UserPlus className="h-4 w-4 text-zinc-400" /> Join with invite code
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onCreate();
              }}
              className={item}
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
  const [quickTitle, setQuickTitle] = useState('');
  const [quickBusy, setQuickBusy] = useState(false);

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
  // On-time share weighs 70%, completion 30% (same as backend telemetry).
  const healthScore = total ? Math.round((1 - overdue / total) * 70 + completionRate * 0.3) : 100;

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

  const quickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title || !workspaceId) return;
    setQuickBusy(true);
    try {
      const t = await api.createTask(workspaceId, { title });
      setTasks((p) => upsert(p, t));
      markFresh(t.id);
      setQuickTitle('');
    } catch (err) {
      fail(err);
    } finally {
      setQuickBusy(false);
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
      <div className="relative min-h-screen bg-white text-zinc-900 dark:bg-black dark:text-zinc-100">
        <AppBackdrop />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-lg">You're not in any workspace yet.</p>
          <Link to="/profile" className={primaryBtn}>
            Create or join one
          </Link>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total tasks', value: total, icon: <CheckSquare className="h-4 w-4" />, tint: 'text-sky-600 dark:text-sky-300' },
    { label: 'In progress', value: inProgress, icon: <Clock className="h-4 w-4" />, tint: 'text-amber-600 dark:text-amber-300' },
    { label: 'Completed', value: done, icon: <CheckCircle2 className="h-4 w-4" />, tint: 'text-emerald-600 dark:text-emerald-300' },
    {
      label: 'Overdue',
      value: overdue,
      icon: <AlertTriangle className="h-4 w-4" />,
      tint: overdue ? 'text-red-600 dark:text-red-300' : 'text-zinc-400 dark:text-zinc-500',
    },
  ];
  const healthTone = healthScore >= 70 ? 'good' : healthScore >= 40 ? 'warn' : 'bad';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const onlineIds = new Set(presence.map((p) => p.userId));

  return (
    <div className="relative min-h-screen bg-white font-sans text-zinc-900 antialiased transition-colors duration-300 selection:bg-black selection:text-white dark:bg-black dark:text-zinc-100 dark:selection:bg-white dark:selection:text-black">
      <AppBackdrop />

      <AppHeader
        left={<WorkspaceSwitcher onJoin={() => setModal('join')} onCreate={() => setModal('create')} />}
        right={
          <>
            <span className="hidden items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300 lg:flex">
              <span
                className={`h-2 w-2 rounded-full ${
                  realtimeStatus === 'connected' ? 'animate-pulse bg-emerald-500' : realtimeStatus === 'connecting' ? 'animate-pulse bg-amber-500' : 'bg-red-500'
                }`}
              />
              {realtimeStatus === 'connected' ? 'Live' : realtimeStatus === 'connecting' ? 'Connecting' : 'Offline'}
            </span>
            {workspace.inviteCode && (
              <button onClick={() => setModal('invite')} className={`${ghostBtn} hidden sm:inline-flex`}>
                <UserPlus className="h-4 w-4" /> Invite
              </button>
            )}
          </>
        }
      />

      <main className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:gap-5">
        {/* ================= HERO ================= */}
        <Bento className="fade-up lg:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-black dark:text-zinc-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {workspace.name}
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-black dark:text-white sm:text-4xl">
                {greeting}, {user.name.split(' ')[0]}.
              </h1>
              <p className="mt-2 max-w-xl text-base text-zinc-500 dark:text-zinc-400">
                {overdue
                  ? `${overdue} task${overdue === 1 ? ' is' : 's are'} overdue — let's clear ${overdue === 1 ? 'it' : 'them'} first.`
                  : total
                  ? `${inProgress} in progress and ${done} done. Keep the momentum going.`
                  : 'Your board is fresh. Add the first task to get your team moving.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {presence.slice(0, 4).map((p) => (
                  <Avatar key={p.userId} name={p.name} size="sm" online title={`${p.name}${p.typing ? ' · typing…' : ' · online'}`} />
                ))}
              </div>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">{presence.length} online</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className={`${rowCls} !p-4`}>
                <div className={`mb-2 flex items-center gap-1.5 text-sm font-medium ${k.tint}`}>
                  {k.icon}
                  <span className="text-zinc-500 dark:text-zinc-400">{k.label}</span>
                </div>
                <div className="text-3xl font-bold tabular-nums text-black dark:text-white">{loading ? '–' : k.value}</div>
              </div>
            ))}
          </div>

          {canWrite && (
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => setModal('task')} className={primaryBtn}>
                <Plus className="h-4 w-4" /> New task
              </button>
              <button onClick={() => setModal('event')} className={ghostBtn}>
                <Calendar className="h-4 w-4" /> Schedule
              </button>
              {workspace.inviteCode && (
                <button onClick={() => setModal('invite')} className={ghostBtn}>
                  <UserPlus className="h-4 w-4" /> Invite teammates
                </button>
              )}
            </div>
          )}
        </Bento>

        {/* ================= HEALTH ================= */}
        <Bento className="fade-up flex flex-col lg:col-span-4" style={{ animationDelay: '60ms' }}>
          <BentoHeader icon={<Flame className="h-5 w-5" />} title="Sprint health" subtitle="Completion vs. overdue work" />
          <div className="flex flex-1 flex-col items-center justify-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
            <RingGauge value={healthScore} tone={healthTone}>
              <span className="text-3xl font-extrabold tabular-nums text-black dark:text-white">{healthScore}%</span>
              <span className="text-xs font-medium text-zinc-500">{healthTone === 'good' ? 'Healthy' : healthTone === 'warn' ? 'At risk' : 'Critical'}</span>
            </RingGauge>
            <dl className="w-full max-w-[12rem] space-y-3 text-sm">
              {[
                { k: 'Completion', v: `${completionRate}%`, bar: completionRate, color: 'bg-emerald-500' },
                { k: 'In progress', v: inProgress, bar: total ? (inProgress / total) * 100 : 0, color: 'bg-amber-500' },
                { k: 'Overdue', v: overdue, bar: total ? (overdue / total) * 100 : 0, color: 'bg-red-500' },
              ].map((r) => (
                <div key={r.k}>
                  <div className="mb-1 flex justify-between">
                    <dt className="text-zinc-500 dark:text-zinc-400">{r.k}</dt>
                    <dd className="font-semibold tabular-nums text-black dark:text-white">{r.v}</dd>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
                    <div className={`h-full rounded-full ${r.color} transition-all duration-700`} style={{ width: `${r.bar}%` }} />
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </Bento>

        {/* ================= TASKS ================= */}
        <Bento className="fade-up flex flex-col lg:col-span-8 lg:row-span-2" style={{ animationDelay: '120ms' }}>
          <BentoHeader
            icon={<CheckSquare className="h-5 w-5" />}
            title="Sprint deliverables"
            subtitle={`${filteredTasks.length} of ${tasks.length} tasks`}
            action={
              canWrite && (
                <button onClick={() => setModal('task')} className={primaryBtn}>
                  <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add task</span>
                </button>
              )
            }
          />

          <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-2xl border border-black/10 bg-zinc-100 p-1 text-sm dark:border-white/10 dark:bg-black/60">
            <Filter className="ml-2 mr-1 h-4 w-4 text-zinc-400" />
            {(['ALL', 'TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE'] as const).map((f) => {
              const count =
                f === 'ALL' ? tasks.length : f === 'OVERDUE' ? overdue : tasks.filter((t) => t.status === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition ${
                    statusFilter === f
                      ? 'bg-white text-black shadow-sm dark:bg-zinc-900 dark:text-white'
                      : 'text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  {f.replace('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                  <span className="text-xs tabular-nums text-zinc-400">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="-mr-2 max-h-[46rem] flex-1 space-y-2.5 overflow-y-auto pr-2">
            {loading ? (
              [0, 1, 2].map((i) => <div key={i} className={`${rowCls} h-28 animate-pulse`} />)
            ) : filteredTasks.length === 0 ? (
              <div className={`${wellCls} flex flex-col items-center px-6 py-14 text-center`}>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
                  <CheckSquare className="h-6 w-6 text-zinc-500" />
                </div>
                <h3 className="mb-1 text-base font-semibold text-black dark:text-white">{tasks.length ? 'Nothing in this view' : 'Your board is empty'}</h3>
                <p className="mb-4 max-w-sm text-sm text-zinc-500">{tasks.length ? 'No tasks match the active filter.' : 'Add the first deliverable for your team.'}</p>
                {!tasks.length && canWrite && (
                  <button onClick={() => setModal('task')} className={primaryBtn}>
                    <Plus className="h-4 w-4" /> Create first task
                  </button>
                )}
              </div>
            ) : (
              filteredTasks.map((task) => {
                const late = isOverdue(task, today);
                const isDone = task.status === 'DONE';
                return (
                  <article key={task.id} className={`${rowCls} group flex gap-3 ${freshIds.has(task.id) ? 'flash-in' : ''}`}>
                    <button
                      disabled={!canWrite}
                      onClick={() => updateStatus(task.id, isDone ? 'TODO' : 'DONE')}
                      title={isDone ? 'Mark as to do' : 'Mark as done'}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                        isDone
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-zinc-300 text-transparent hover:border-emerald-500 hover:text-emerald-500 dark:border-zinc-700'
                      }`}
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-[0.95rem] font-semibold leading-snug ${isDone ? 'text-zinc-400 line-through' : 'text-black dark:text-zinc-100'}`}>
                          {task.title}
                        </h3>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className={`rounded-lg border px-2 py-0.5 text-xs font-semibold ${PRIORITY_STYLE[task.priority]}`}>
                            {task.priority[0] + task.priority.slice(1).toLowerCase()}
                          </span>
                          {canWrite && (
                            <button onClick={() => deleteTask(task.id)} className={`${iconBtn} opacity-0 hover:!text-red-500 group-hover:opacity-100`} title="Delete task">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      {task.description && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{task.description}</p>}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className={chipCls}>{task.label || 'General'}</span>
                          <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                            {task.assignee && <Avatar name={task.assignee.name} size="xs" className="!ring-0" />}
                            {task.assignee?.name ?? 'Unassigned'}
                          </span>
                          {task.dueDate && (
                            <span
                              className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${
                                late ? 'bg-red-500/10 text-red-600 dark:text-red-300' : 'bg-black/[0.04] text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400'
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
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Quick add + progress footer — anchors the tile when there are few tasks */}
          <div className="mt-auto space-y-4 pt-4">
            {canWrite && (
              <form onSubmit={quickAdd} className="flex items-center gap-2 rounded-2xl border border-dashed border-black/15 bg-white/60 py-1.5 pl-4 pr-1.5 transition focus-within:border-black/40 dark:border-white/15 dark:bg-black/30 dark:focus-within:border-white/40">
                <Plus className="h-4 w-4 shrink-0 text-zinc-400" />
                <input
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  onFocus={() => updatePresence({ viewing: 'tasks' })}
                  placeholder="Quick add a task — press Enter"
                  className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-black placeholder-zinc-400 focus:outline-none dark:text-white dark:placeholder-zinc-500"
                  maxLength={200}
                />
                <button type="submit" disabled={!quickTitle.trim() || quickBusy} className={`${primaryBtn} !px-3 !py-1.5`}>
                  {quickBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                </button>
              </form>
            )}
            <div>
              <div className="mb-1.5 flex justify-between text-xs font-medium text-zinc-500">
                <span>
                  {total - done} open · {done} done
                </span>
                <span className="tabular-nums">{completionRate}% complete</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
          </div>
        </Bento>

        {/* ================= CALENDAR ================= */}
        <Bento className="fade-up lg:col-span-4" style={{ animationDelay: '180ms' }}>
          <BentoHeader
            icon={<Calendar className="h-5 w-5" />}
            title="Team calendar"
            subtitle={googleReady ? `+ Google · ${google!.accountLabel}` : 'Workspace events'}
            action={
              canWrite && (
                <button onClick={() => setModal('event')} className={`${ghostBtn} !px-2.5`} title="Schedule event">
                  <Plus className="h-4 w-4" />
                </button>
              )
            }
          />
          <div className={`${wellCls} p-3`}>
            <div className="mb-2 flex items-center justify-between">
              <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className={iconBtn} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-black dark:text-white">{month.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</span>
              <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className={iconBtn} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-1 grid grid-cols-7 text-center text-xs font-semibold text-zinc-400">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i} className="py-1">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-sm">
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
                    className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-xl tabular-nums transition ${
                      isSel
                        ? 'bg-black font-bold text-white dark:bg-white dark:text-black'
                        : isToday
                        ? 'font-bold text-emerald-600 ring-1 ring-emerald-500/50 dark:text-emerald-400'
                        : 'text-zinc-600 hover:bg-black/[0.05] dark:text-zinc-400 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    {day}
                    <span className="absolute bottom-1 flex gap-0.5">
                      {has.team && <span className={`h-1 w-1 rounded-full ${isSel ? 'bg-white dark:bg-black' : 'bg-violet-500'}`} />}
                      {has.google && <span className="h-1 w-1 rounded-full bg-sky-500" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between px-1 text-sm">
              <span className="font-semibold text-black dark:text-white">
                {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
              <span className="text-zinc-400">{dayTeamEvents.length + dayGoogleEvents.length} event(s)</span>
            </div>
            {dayTeamEvents.length + dayGoogleEvents.length === 0 ? (
              <div className={`${wellCls} border-dashed p-4 text-center text-sm text-zinc-400`}>Nothing scheduled.</div>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {dayTeamEvents.map((ev) => (
                  <div key={ev.id} className={`${rowCls} group !p-3`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`rounded-lg border px-2 py-0.5 font-semibold ${CATEGORY_STYLE[ev.category]}`}>{ev.category[0] + ev.category.slice(1).toLowerCase()}</span>
                      <span className="flex items-center gap-1 text-zinc-500">
                        <Clock className="h-3.5 w-3.5" /> {fmtTime(ev.startsAt)}
                      </span>
                    </div>
                    <h4 className="mt-1.5 text-sm font-semibold text-black dark:text-zinc-100">{ev.title}</h4>
                    <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                      <span className="flex min-w-0 items-center gap-1 truncate">
                        <Video className="h-3.5 w-3.5 shrink-0" />
                        {ev.location && /^https?:\/\//.test(ev.location) ? (
                          <a href={ev.location} target="_blank" rel="noreferrer" className="truncate font-medium text-black underline-offset-2 hover:underline dark:text-white">
                            Join call
                          </a>
                        ) : (
                          <span className="truncate">{ev.location || 'No location'}</span>
                        )}
                        {ev.googleEventId && <span className="ml-1 rounded bg-sky-500/10 px-1.5 text-sky-600 dark:text-sky-300">Google</span>}
                      </span>
                      {canWrite && (
                        <button onClick={() => deleteEvent(ev.id)} className={`${iconBtn} !p-1 opacity-0 hover:!text-red-500 group-hover:opacity-100`} title="Cancel event">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {dayGoogleEvents.map((ev) => (
                  <a key={ev.id} href={ev.htmlLink} target="_blank" rel="noreferrer" className={`${rowCls} block !border-sky-500/25 !p-3`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-semibold text-sky-600 dark:text-sky-300">Google</span>
                      <span className="flex items-center gap-1 text-zinc-500">
                        <Clock className="h-3.5 w-3.5" /> {ev.allDay ? 'All day' : fmtTime(ev.startsAt)}
                      </span>
                    </div>
                    <h4 className="mt-1.5 text-sm font-semibold text-black dark:text-zinc-100">{ev.title}</h4>
                    {ev.location && <p className="mt-1 truncate text-xs text-zinc-500">{ev.location}</p>}
                  </a>
                ))}
              </div>
            )}
            {google?.needsReconnect ? (
              <Link to="/profile" className="block rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs font-medium text-amber-700 hover:bg-amber-500/15 dark:text-amber-200">
                Google Calendar needs calendar permission — reconnect in your profile →
              </Link>
            ) : (
              !google?.connected && (
                <Link to="/profile" className="block pt-1 text-center text-xs text-zinc-400 hover:text-black dark:hover:text-white">
                  Connect Google Calendar to see your meetings here →
                </Link>
              )
            )}
          </div>
        </Bento>

        {/* ================= TEAM ================= */}
        <Bento className="fade-up lg:col-span-4" style={{ animationDelay: '240ms' }}>
          <BentoHeader
            icon={<Users className="h-5 w-5" />}
            title="Team"
            subtitle={`${members.length} member${members.length === 1 ? '' : 's'} · ${presence.length} online`}
            action={
              workspace.inviteCode && (
                <button onClick={() => setModal('invite')} className={`${ghostBtn} !px-2.5`} title="Invite teammates">
                  <UserPlus className="h-4 w-4" />
                </button>
              )
            }
          />
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {members.map((m) => {
              const p = presence.find((x) => x.userId === m.id);
              return (
                <li key={m.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
                  <Avatar name={m.name} size="sm" online={onlineIds.has(m.id)} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-black dark:text-zinc-100">
                      {m.name}
                      {m.id === user.id && <span className="ml-1 text-zinc-400">(you)</span>}
                    </div>
                    <div className="truncate text-xs text-zinc-500">
                      {p?.typing ? <span className="text-emerald-600 dark:text-emerald-400">typing…</span> : onlineIds.has(m.id) ? 'Online now' : 'Offline'}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold ${ROLE_STYLE[m.role]}`}>{m.role.toLowerCase()}</span>
                </li>
              );
            })}
          </ul>
        </Bento>

        {/* ================= GITHUB ================= */}
        <Bento className="fade-up flex flex-col lg:col-span-7" style={{ animationDelay: '300ms' }}>
          <BentoHeader
            icon={<GithubIcon className="h-5 w-5" />}
            title="GitHub activity"
            subtitle={
              workspace.repoFullName ? (
                <a href={`https://github.com/${workspace.repoFullName}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono hover:text-black dark:hover:text-white">
                  {workspace.repoFullName}
                  <GitBranch className="ml-1 h-3.5 w-3.5" />
                  {workspace.defaultBranch}
                </a>
              ) : (
                'No repository connected'
              )
            }
            action={
              <>
                {workspace.repoFullName && github?.connected && canWrite && (
                  <button onClick={syncNow} disabled={syncing} className={`${ghostBtn} !px-2.5`} title="Pull latest commits from GitHub">
                    <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  </button>
                )}
                {isAdmin && (
                  <button onClick={() => setModal('repo')} className={`${ghostBtn} !px-2.5`} title="Configure repository">
                    <Settings className="h-4 w-4" />
                  </button>
                )}
              </>
            }
          />

          {workspace.repoFullName && (
            <div className="mb-3 flex items-center justify-between gap-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${github?.connected ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                {github?.connected
                  ? workspace.githubSyncedAt
                    ? `Synced ${timeAgo(workspace.githubSyncedAt)} · auto-syncs every 3 min`
                    : 'Waiting for first sync…'
                  : 'Connect GitHub in your profile to sync real commits'}
              </span>
              {canWrite && (
                <button onClick={() => setModal('commit')} className="font-medium text-zinc-500 hover:text-black dark:hover:text-white">
                  + Log manually
                </button>
              )}
            </div>
          )}

          <div className="-mr-2 max-h-[26rem] flex-1 space-y-2 overflow-y-auto pr-2">
            {commits.length === 0 ? (
              <div className={`${wellCls} flex flex-col items-center border-dashed px-6 py-10 text-center`}>
                <GitCommit className="mb-2 h-6 w-6 text-zinc-400" />
                <p className="mb-4 text-sm text-zinc-500">{workspace.repoFullName ? 'No commits yet.' : 'Connect a repository to stream its commits here.'}</p>
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
                    className={`${rowCls} group flex items-start gap-3 !p-3 ${freshIds.has(c.id) ? 'flash-in' : ''}`}
                  >
                    <Avatar name={c.author?.name ?? c.authorName} size="sm" className="!ring-0" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium text-black dark:text-zinc-100">{c.message}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                        <span className="text-zinc-700 dark:text-zinc-300">{c.author?.name ?? c.authorName}</span>
                        <span className="rounded-md bg-black/[0.04] px-1.5 font-mono text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300">{c.sha.slice(0, 7)}</span>
                        <span>{timeAgo(c.committedAt)}</span>
                        {c.source === 'MANUAL' && <span className="rounded-md border border-black/10 px-1.5 dark:border-white/10">manual</span>}
                      </div>
                    </div>
                    {c.url && <ExternalLink className="h-4 w-4 shrink-0 text-zinc-300 transition group-hover:text-zinc-600 dark:text-zinc-700 dark:group-hover:text-zinc-300" />}
                  </Wrapper>
                );
              })
            )}
          </div>
        </Bento>

        {/* ================= ACTIVITY LEDGER ================= */}
        <Bento className="fade-up flex flex-col lg:col-span-5" style={{ animationDelay: '360ms' }}>
          <BentoHeader icon={<Activity className="h-5 w-5" />} title="Activity ledger" subtitle="Everything that happened, in one timeline" />
          <ol className="relative -mr-2 max-h-[26rem] flex-1 overflow-y-auto pr-2">
            {activities.length === 0 ? (
              <li className="py-8 text-center text-sm text-zinc-400">No activity yet.</li>
            ) : (
              activities.map((a, i) => (
                <li key={a.id} className={`relative flex gap-3 rounded-xl pb-4 ${freshIds.has(a.id) ? 'flash-in' : ''}`}>
                  {i < activities.length - 1 && <span className="absolute left-[15px] top-9 h-[calc(100%-2rem)] w-px bg-black/10 dark:bg-white/10" />}
                  <div className="relative shrink-0">
                    <Avatar name={a.actor.name} size="sm" className="!ring-0" />
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-zinc-50 dark:ring-zinc-950 ${ACTIVITY_DOT[a.type] ?? 'bg-zinc-400'}`} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="break-words text-sm leading-snug text-zinc-600 dark:text-zinc-300">
                      <span className="font-semibold text-black dark:text-zinc-100">{a.actor.name}</span> {a.summary}
                    </p>
                    <span className="text-xs text-zinc-400">{timeAgo(a.createdAt)}</span>
                  </div>
                </li>
              ))
            )}
          </ol>
        </Bento>
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
          icon={<GitCommit className="h-5 w-5" />}
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
          icon={<UserPlus className="h-5 w-5" />}
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
          icon={<Plus className="h-5 w-5" />}
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
    <button type="button" onClick={onCancel} className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white">
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
    <Modal title="Create task" icon={<CheckSquare className="h-5 w-5" />} onClose={onClose} wide>
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
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-2xl border border-black/10 bg-zinc-50 p-1.5 dark:border-white/10 dark:bg-black/60">
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
                  className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition ${
                    repo === r.fullName ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-zinc-700 hover:bg-black/[0.05] dark:text-zinc-300 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="flex-1 truncate font-mono">{r.fullName}</span>
                  {r.private && <span className="rounded-md border border-current/20 px-1.5 text-xs opacity-70">private</span>}
                  <span className="text-xs opacity-60">{timeAgo(r.pushedAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-sky-500/25 bg-sky-500/[0.07] p-3 text-sm text-sky-700 dark:text-sky-200">
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
            <button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white">
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
    <Modal title="Schedule event" icon={<Calendar className="h-5 w-5" />} onClose={onClose} wide>
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
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-sky-500/25 bg-sky-500/[0.06] px-3 py-2.5 text-sm text-sky-700 dark:text-sky-100">
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
    <Modal title={`Invite to ${workspace.name}`} icon={<UserPlus className="h-5 w-5" />} onClose={onClose}>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">Friends with a Syncro account can join using this code or link. They'll join as members.</p>
      <div className="mb-3 rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/[0.06] p-6 text-center">
        <div className="mb-1 text-xs uppercase tracking-wider text-zinc-500">Invite code</div>
        <div className="select-all font-mono text-3xl font-bold tracking-[0.2em] text-black dark:text-white">{workspace.inviteCode}</div>
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
        Manage codes in your <Link to="/profile" className="font-medium text-black underline-offset-2 hover:underline dark:text-white">profile</Link>.
      </p>
    </Modal>
  );
};

export default WorkspaceApp;
