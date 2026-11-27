import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Clock, ExternalLink, Loader2, Radio, Trash2, Video, Zap } from 'lucide-react';
import { api } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { Avatar, Bento, BentoHeader, inputCls, labelCls, primaryBtn, wellCls } from './ui';
import { PROVIDER_META, localDateStr, useNow } from '../lib/workflow';
import type { Meeting, MeetingProvider } from '../types';

export const meetingWindow = (m: Meeting) => {
  const start = new Date(m.startsAt).getTime();
  return { start, end: start + m.durationMinutes * 60_000 };
};
export const isLive = (m: Meeting, now = Date.now()) => {
  const { start, end } = meetingWindow(m);
  return now >= start - 5 * 60_000 && now < end;
};

const relTime = (ms: number) => {
  const m = Math.round(ms / 60_000);
  if (m < 60) return `in ${m} min`;
  if (m < 24 * 60) return `in ${Math.round(m / 60)}h`;
  return `in ${Math.round(m / 1440)}d`;
};

const ProviderBadge: React.FC<{ p: MeetingProvider }> = ({ p }) => (
  <span className="inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-zinc-600 dark:border-white/10 dark:bg-black dark:text-zinc-300">
    <span className={`h-1.5 w-1.5 rounded-full ${PROVIDER_META[p].tint}`} /> {PROVIDER_META[p].short}
  </span>
);

export const MeetingRow: React.FC<{ m: Meeting; now: number; onDelete?: () => void }> = ({ m, now, onDelete }) => {
  const live = isLive(m, now);
  const { start, end } = meetingWindow(m);
  const past = now >= end;
  return (
    <li className={`group flex items-center gap-3 rounded-2xl border p-3.5 ${live ? 'border-emerald-500/40 bg-emerald-500/[0.06]' : 'border-black/[0.07] bg-white dark:border-white/[0.07] dark:bg-black/50'}`}>
      <div className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-center ${live ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'}`}>
        {live ? (
          <Radio className="h-5 w-5" />
        ) : (
          <>
            <span className="text-[10px] font-semibold uppercase leading-none">{new Date(start).toLocaleDateString(undefined, { month: 'short' })}</span>
            <span className="text-base font-bold leading-tight">{new Date(start).getDate()}</span>
          </>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-black dark:text-white">{m.title}</span>
          <ProviderBadge p={m.provider} />
        </div>
        <div className="truncate text-xs text-zinc-500">
          {live ? 'Live now' : past ? 'Ended' : relTime(start - now)} · {new Date(start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · {m.durationMinutes} min · by{' '}
          {m.createdBy.name.split(' ')[0]}
          {m.task && ` · ${m.task.title}`}
        </div>
      </div>
      {onDelete && (
        <button onClick={onDelete} className="rounded-lg p-2 text-zinc-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100" aria-label="Cancel meeting">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      {!past && (
        <a
          href={m.joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 text-sm font-bold transition ${
            live ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'border border-black/10 text-zinc-700 hover:border-black/30 dark:border-white/10 dark:text-zinc-200'
          }`}
        >
          Join <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </li>
  );
};

export const MeetingsView: React.FC = () => {
  const { workspaceId, workspace, meetings, setMeetings, integrations, canWrite, isAdmin, user, tasks, presence, fail, toast } = useWorkspace();
  const now = useNow(15_000);
  const google = integrations.find((i) => i.provider === 'google');
  const zoom = integrations.find((i) => i.provider === 'zoom');
  const ready: Record<MeetingProvider, boolean> = {
    INSTANT: true,
    GOOGLE_MEET: !!google?.connected && !google.needsReconnect,
    ZOOM: !!zoom?.connected,
  };

  // ---------- instant ----------
  const [instantBusy, setInstantBusy] = useState(false);
  const startInstant = async () => {
    setInstantBusy(true);
    try {
      const m = await api.createMeeting(workspaceId, { title: `${workspace.name} huddle`, provider: 'INSTANT' });
      setMeetings((l) => (l.some((x) => x.id === m.id) ? l : [...l, m]));
      window.open(m.joinUrl, '_blank', 'noopener');
      toast('success', 'Room is open. Your team can join from Syncro.');
    } catch (err) {
      fail(err);
    } finally {
      setInstantBusy(false);
    }
  };

  // ---------- schedule ----------
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState<MeetingProvider>('INSTANT');
  const [date, setDate] = useState(() => localDateStr(new Date()));
  const [time, setTime] = useState(() => {
    const d = new Date(Date.now() + 60 * 60_000);
    return `${String(d.getHours()).padStart(2, '0')}:00`;
  });
  const [duration, setDuration] = useState(30);
  const [taskId, setTaskId] = useState('');
  const [invite, setInvite] = useState(true);
  const [busy, setBusy] = useState(false);
  // Smart default: prefer a real calendar tool when one is connected (Tesler's Law).
  useEffect(() => {
    if (ready.GOOGLE_MEET) setProvider('GOOGLE_MEET');
    else if (ready.ZOOM) setProvider('ZOOM');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready.GOOGLE_MEET, ready.ZOOM]);

  const schedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const startsAt = new Date(`${date}T${time}`);
    if (Number.isNaN(startsAt.getTime())) return toast('error', 'Pick a valid date and time');
    setBusy(true);
    try {
      const m = await api.createMeeting(workspaceId, {
        title: title.trim(),
        provider,
        startsAt: startsAt.toISOString(),
        durationMinutes: duration,
        taskId: taskId || null,
        inviteMembers: provider === 'GOOGLE_MEET' && invite,
      });
      setMeetings((l) => (l.some((x) => x.id === m.id) ? l : [...l, m]).sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
      setTitle('');
      toast('success', `${PROVIDER_META[provider].label} scheduled${provider === 'GOOGLE_MEET' && invite ? ' and invites sent' : ''}`);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (m: Meeting) => {
    if (!window.confirm(`Cancel "${m.title}"?${m.provider !== 'INSTANT' ? ` It will also be removed from ${PROVIDER_META[m.provider].label}.` : ''}`)) return;
    const snapshot = meetings;
    setMeetings((l) => l.filter((x) => x.id !== m.id));
    try {
      await api.deleteMeeting(workspaceId, m.id);
    } catch (err) {
      setMeetings(snapshot);
      fail(err);
    }
  };

  const live = meetings.filter((m) => isLive(m, now));
  const upcoming = meetings.filter((m) => !isLive(m, now) && meetingWindow(m).start > now);
  const past = meetings.filter((m) => meetingWindow(m).end <= now).reverse().slice(0, 8);
  const canDelete = (m: Meeting) => m.createdBy.id === user.id || isAdmin;

  return (
    <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
      {/* ---------- instant CTA (Von Restorff: the one bold action) ---------- */}
      <Bento className="fade-up relative overflow-hidden lg:col-span-5">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <Zap className="h-3.5 w-3.5" /> No account or download needed
        </span>
        <h2 className="font-hand text-5xl font-bold leading-none text-black dark:text-white">Huddle now</h2>
        <p className="mb-6 mt-2 max-w-sm text-base text-zinc-500 dark:text-zinc-400">
          Open a video room in one click. Everyone in {workspace.name} sees it live and can jump in.
        </p>
        <button
          onClick={startInstant}
          disabled={!canWrite || instantBusy}
          className="inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-500 px-6 text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50 sm:w-auto"
        >
          {instantBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Video className="h-5 w-5" />} Start instant meeting
        </button>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex -space-x-2">
            {presence.slice(0, 6).map((p) => (
              <Avatar key={p.userId} name={p.name} size="sm" online />
            ))}
          </div>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {presence.length <= 1 ? 'Only you are online right now' : `${presence.length} teammates online can join instantly`}
          </span>
        </div>

        {live.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-black dark:text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Live now
            </h3>
            <ul className="space-y-2">
              {live.map((m) => (
                <MeetingRow key={m.id} m={m} now={now} onDelete={canDelete(m) ? () => void remove(m) : undefined} />
              ))}
            </ul>
          </div>
        )}
      </Bento>

      {/* ---------- schedule ---------- */}
      <Bento className="fade-up lg:col-span-7" style={{ animationDelay: '60ms' }}>
        <BentoHeader icon={<CalendarPlus className="h-5 w-5" />} title="Schedule a meeting" subtitle="Creates the real meeting link for you" />
        <form onSubmit={schedule} className="space-y-4">
          <div>
            <label className={labelCls}>Where</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PROVIDER_META) as MeetingProvider[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={!ready[p]}
                  onClick={() => setProvider(p)}
                  className={`flex min-h-[56px] flex-col items-start justify-center rounded-xl border px-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    provider === p ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black' : 'border-black/10 hover:border-black/30 dark:border-white/10 dark:hover:border-white/30'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-sm font-bold">
                    <span className={`h-2 w-2 rounded-full ${PROVIDER_META[p].tint}`} /> {PROVIDER_META[p].label}
                  </span>
                  <span className={`text-[11px] ${provider === p ? 'opacity-70' : 'text-zinc-500'}`}>
                    {ready[p] ? (p === 'INSTANT' ? 'Works for everyone' : 'Connected') : 'Connect in profile'}
                  </span>
                </button>
              ))}
            </div>
            {(!ready.GOOGLE_MEET || !ready.ZOOM) && (
              <p className="mt-2 text-xs text-zinc-500">
                Want Google Meet or Zoom links?{' '}
                <Link to="/profile" className="font-semibold text-black underline-offset-2 hover:underline dark:text-white">
                  Connect them in your profile
                </Link>
                .
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sprint planning" maxLength={160} className={inputCls} required />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={date} min={localDateStr(new Date())} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className={labelCls}>Length</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputCls}>
                {[15, 30, 45, 60, 90].map((d) => (
                  <option key={d} value={d}>
                    {d} min
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>About a card (optional)</label>
            <select value={taskId} onChange={(e) => setTaskId(e.target.value)} className={inputCls}>
              <option value="">No card</option>
              {tasks
                .filter((t) => t.status !== 'DONE')
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
            </select>
          </div>
          {provider === 'GOOGLE_MEET' && (
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
              <input type="checkbox" checked={invite} onChange={(e) => setInvite(e.target.checked)} className="h-4 w-4 accent-emerald-500" />
              Email calendar invites to everyone in {workspace.name}
            </label>
          )}
          <button type="submit" disabled={!canWrite || busy || !title.trim()} className={`${primaryBtn} w-full`}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />} Schedule {PROVIDER_META[provider].label}
          </button>
        </form>
      </Bento>

      {/* ---------- lists ---------- */}
      <Bento className="fade-up lg:col-span-7" style={{ animationDelay: '120ms' }}>
        <BentoHeader icon={<Clock className="h-5 w-5" />} title="Upcoming" subtitle={`${upcoming.length} scheduled`} />
        <ul className="space-y-2">
          {upcoming.map((m) => (
            <MeetingRow key={m.id} m={m} now={now} onDelete={canDelete(m) ? () => void remove(m) : undefined} />
          ))}
          {!upcoming.length && <li className={`${wellCls} py-8 text-center text-sm text-zinc-400`}>Nothing on the calendar. Schedule one above.</li>}
        </ul>
      </Bento>
      <Bento className="fade-up lg:col-span-5" style={{ animationDelay: '180ms' }}>
        <BentoHeader icon={<Video className="h-5 w-5" />} title="Recent" subtitle="Last 7 days" />
        <ul className="space-y-2">
          {past.map((m) => (
            <li key={m.id} className="flex items-center gap-3 text-sm">
              <Avatar name={m.createdBy.name} size="xs" className="!ring-0" />
              <span className="min-w-0 flex-1 truncate text-zinc-700 dark:text-zinc-300">{m.title}</span>
              <ProviderBadge p={m.provider} />
              <span className="w-16 text-right text-xs text-zinc-400">{new Date(m.startsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </li>
          ))}
          {!past.length && <li className="py-6 text-center text-sm text-zinc-400">No meetings yet.</li>}
        </ul>
      </Bento>
    </div>
  );
};

export default MeetingsView;
