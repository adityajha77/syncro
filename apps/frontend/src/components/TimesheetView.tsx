import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, Loader2, Plus, Timer, Trash2, Users } from 'lucide-react';
import { api } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { Avatar, Bento, BentoHeader, ghostBtn, inputCls, labelCls, primaryBtn, wellCls } from './ui';
import { clock, dur, entrySeconds, localDateStr, parseMinutes, startOfDay, startOfWeek, useNow } from '../lib/workflow';
import type { TimeEntry } from '../types';

type Range = 'today' | 'week' | 'last7' | 'lastWeek';
const RANGES: { id: Range; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'lastWeek', label: 'Last week' },
  { id: 'last7', label: 'Last 7 days' },
];

const rangeBounds = (r: Range) => {
  const today = startOfDay();
  if (r === 'today') return { from: today, to: new Date(today.getTime() + 86_400_000), days: 1 };
  if (r === 'week') {
    const from = startOfWeek();
    return { from, to: new Date(from.getTime() + 7 * 86_400_000), days: 7 };
  }
  if (r === 'lastWeek') {
    const to = startOfWeek();
    return { from: new Date(to.getTime() - 7 * 86_400_000), to, days: 7 };
  }
  return { from: new Date(today.getTime() - 6 * 86_400_000), to: new Date(today.getTime() + 86_400_000), days: 7 };
};

/** Fixed-order categorical slots, assigned by member join order (colour follows the person). */
const seriesVar = (i: number) => (i < 8 ? `var(--series-${i + 1})` : 'rgb(161 161 170)');

export const TimesheetView: React.FC = () => {
  const { workspaceId, user, members, tasks, isAdmin, canWrite, pulseVersion, fail, toast, openTask } = useWorkspace();
  const [range, setRange] = useState<Range>('week');
  const [who, setWho] = useState<'all' | 'me'>('all');
  const [entries, setEntries] = useState<TimeEntry[] | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const now = useNow(1000);
  const bounds = useMemo(() => rangeBounds(range), [range]);

  const load = useCallback(async () => {
    try {
      setEntries(
        await api.timeEntries(workspaceId, {
          from: bounds.from.toISOString(),
          to: bounds.to.toISOString(),
          ...(who === 'me' && { userId: user.id }),
        })
      );
    } catch (err) {
      fail(err);
    }
  }, [workspaceId, bounds, who, user.id, fail]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), pulseVersion ? 300 : 0);
    return () => window.clearTimeout(t);
  }, [load, pulseVersion]);

  // ---------- derived ----------
  const memberIndex = useMemo(() => new Map(members.map((m, i) => [m.id, i])), [members]);
  const clipped = (e: TimeEntry, from: number, to: number) => {
    const s = Math.max(new Date(e.startedAt).getTime(), from);
    const end = Math.min(e.endedAt ? new Date(e.endedAt).getTime() : now, to);
    return Math.max(0, (end - s) / 1000);
  };
  const days = useMemo(
    () => Array.from({ length: bounds.days }, (_, i) => new Date(bounds.from.getTime() + i * 86_400_000)),
    [bounds]
  );
  const list = entries ?? [];
  const peopleInRange = members.filter((m) => list.some((e) => e.userId === m.id));
  const perDay = days.map((d) => {
    const from = d.getTime();
    const to = from + 86_400_000;
    const byMember = peopleInRange.map((m) => ({
      m,
      seconds: list.filter((e) => e.userId === m.id).reduce((s, e) => s + clipped(e, from, to), 0),
    }));
    return { d, byMember, total: byMember.reduce((s, x) => s + x.seconds, 0) };
  });
  const maxDay = Math.max(3600, ...perDay.map((x) => x.total));
  const total = perDay.reduce((s, x) => s + x.total, 0);
  const perMember = peopleInRange
    .map((m) => ({ m, seconds: perDay.reduce((s, d) => s + (d.byMember.find((x) => x.m.id === m.id)?.seconds ?? 0), 0) }))
    .sort((a, b) => b.seconds - a.seconds);
  const perTask = useMemo(() => {
    const map = new Map<string, { id: string | null; title: string; seconds: number }>();
    for (const e of list) {
      const key = e.task?.id ?? 'none';
      const cur = map.get(key) ?? { id: e.task?.id ?? null, title: e.task?.title ?? 'No card (focus time)', seconds: 0 };
      cur.seconds += clipped(e, bounds.from.getTime(), bounds.to.getTime());
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.seconds - a.seconds).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, bounds, Math.floor(now / 30_000)]);
  const activeDays = perDay.filter((d) => d.total > 0).length;

  // Y-axis ticks in whole hours.
  const stepH = Math.max(1, Math.ceil(maxDay / 3600 / 4));
  const ticks = Array.from({ length: Math.floor(maxDay / 3600 / stepH) + 1 }, (_, i) => i * stepH);
  const scaleMax = Math.max(maxDay, (ticks[ticks.length - 1] ?? 1) * 3600);

  const exportCsv = () => {
    const rows = [
      ['Date', 'Start', 'End', 'Member', 'Card', 'Minutes', 'Type', 'Note'],
      ...list.map((e) => [
        localDateStr(new Date(e.startedAt)),
        new Date(e.startedAt).toLocaleTimeString(),
        e.endedAt ? new Date(e.endedAt).toLocaleTimeString() : 'running',
        e.user.name,
        e.task?.title ?? '',
        String(Math.round(entrySeconds(e, now) / 60)),
        e.manual ? 'manual' : 'timer',
        e.note ?? '',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `syncro-timesheet-${localDateStr(bounds.from)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ---------- manual log ----------
  const [logTask, setLogTask] = useState('');
  const [logDate, setLogDate] = useState(() => localDateStr(new Date()));
  const [logStart, setLogStart] = useState('09:00');
  const [logDur, setLogDur] = useState('');
  const [logNote, setLogNote] = useState('');
  const [logBusy, setLogBusy] = useState(false);
  const submitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseMinutes(logDur);
    if (!minutes) return toast('error', 'Enter a duration like "1h 30m", "45m" or "1:30"');
    setLogBusy(true);
    try {
      await api.logTime(workspaceId, {
        taskId: logTask || null,
        minutes,
        startedAt: new Date(`${logDate}T${logStart || '09:00'}`).toISOString(),
        note: logNote.trim() || undefined,
      });
      toast('success', `Logged ${dur(minutes * 60)}`);
      setLogDur('');
      setLogNote('');
      void load();
    } catch (err) {
      fail(err);
    } finally {
      setLogBusy(false);
    }
  };

  const remove = async (id: string) => {
    const snapshot = entries;
    setEntries((l) => l && l.filter((e) => e.id !== id));
    try {
      await api.deleteTimeEntry(workspaceId, id);
    } catch (err) {
      setEntries(snapshot);
      fail(err);
    }
  };

  const grouped = useMemo(() => {
    const g = new Map<string, TimeEntry[]>();
    for (const e of list) {
      const k = localDateStr(new Date(e.startedAt));
      g.set(k, [...(g.get(k) ?? []), e]);
    }
    return [...g.entries()];
  }, [list]);

  const seg = (on: boolean) =>
    `min-h-[38px] rounded-lg px-3 text-sm font-semibold transition ${on ? 'bg-white text-black shadow-sm dark:bg-zinc-800 dark:text-white' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`;

  return (
    <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
      {/* ---------- filters (one row, above the charts) ---------- */}
      <div className="fade-up flex flex-wrap items-center gap-2 lg:col-span-12">
        <div className="flex gap-1 rounded-xl border border-black/10 bg-zinc-100 p-1 dark:border-white/10 dark:bg-zinc-950">
          {RANGES.map((r) => (
            <button key={r.id} onClick={() => setRange(r.id)} className={seg(range === r.id)}>
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-xl border border-black/10 bg-zinc-100 p-1 dark:border-white/10 dark:bg-zinc-950">
          <button onClick={() => setWho('all')} className={seg(who === 'all')}>
            Everyone
          </button>
          <button onClick={() => setWho('me')} className={seg(who === 'me')}>
            Just me
          </button>
        </div>
        <button onClick={exportCsv} disabled={!list.length} className={`${ghostBtn} ml-auto`}>
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* ---------- chart ---------- */}
      <Bento className="fade-up flex flex-col lg:col-span-8">
        <BentoHeader
          icon={<BarChart3 className="h-5 w-5" />}
          title="Hours by day"
          subtitle={
            <>
              <span className="font-semibold text-black dark:text-white">{dur(total)}</span> tracked
              {activeDays > 1 && <> · {dur(total / activeDays)} per active day</>}
            </>
          }
        />
        {entries === null ? (
          <div className="h-64 animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.05]" />
        ) : (
          <>
            {peopleInRange.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Legend">
                {peopleInRange.map((m) => (
                  <span key={m.id} className="inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: seriesVar(memberIndex.get(m.id) ?? 0) }} /> {m.name}
                  </span>
                ))}
              </div>
            )}
            <div className="relative flex h-64 gap-2 pl-9" role="img" aria-label={`Hours tracked per day, ${dur(total)} total`}>
              {/* gridlines + y labels (recessive) */}
              {ticks.map((h) => (
                <div key={h} className="pointer-events-none absolute left-0 right-0 flex items-center gap-2" style={{ bottom: `calc(${(h * 3600 / scaleMax) * 100}% * (224 / 256) + 24px)` }}>
                  <span className="w-7 text-right text-[11px] tabular-nums text-zinc-400">{h}h</span>
                  <span className="h-px flex-1 bg-black/[0.06] dark:bg-white/[0.07]" />
                </div>
              ))}
              {perDay.map((d, i) => {
                const isToday = localDateStr(d.d) === localDateStr(new Date());
                return (
                  <div
                    key={i}
                    className="relative z-[1] flex min-w-0 flex-1 cursor-default flex-col items-center"
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <div className="flex w-full flex-1 flex-col-reverse items-center" style={{ height: 224 }}>
                      {/* stacked segments: 2px surface gap, rounded data-end on top */}
                      <div className="flex w-full max-w-[44px] flex-col-reverse gap-[2px]" style={{ height: `${(d.total / scaleMax) * 100}%` }}>
                        {d.byMember
                          .filter((x) => x.seconds > 0)
                          .map((x, j, arr) => (
                            <div
                              key={x.m.id}
                              className={`w-full ${j === arr.length - 1 ? 'rounded-t' : ''} transition-opacity ${hover !== null && hover !== i ? 'opacity-50' : ''}`}
                              style={{ flexGrow: x.seconds, flexBasis: 0, minHeight: 2, background: seriesVar(memberIndex.get(x.m.id) ?? 0) }}
                            />
                          ))}
                      </div>
                    </div>
                    <div className={`mt-1.5 h-[18px] text-xs ${isToday ? 'font-bold text-black dark:text-white' : 'text-zinc-500'}`}>
                      {bounds.days === 1 ? 'Today' : d.d.toLocaleDateString(undefined, { weekday: 'short' })}
                    </div>
                    {hover === i && d.total > 0 && (
                      <div className="pointer-events-none absolute bottom-full z-10 mb-1 w-44 rounded-xl border border-black/10 bg-white p-3 text-left shadow-xl dark:border-white/10 dark:bg-zinc-900">
                        <div className="mb-1.5 text-xs font-semibold text-zinc-500">
                          {d.d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        </div>
                        {d.byMember
                          .filter((x) => x.seconds > 0)
                          .map((x) => (
                            <div key={x.m.id} className="flex items-center gap-1.5 text-sm">
                              <span className="h-2 w-2 rounded-sm" style={{ background: seriesVar(memberIndex.get(x.m.id) ?? 0) }} />
                              <span className="min-w-0 flex-1 truncate text-zinc-600 dark:text-zinc-300">{x.m.name.split(' ')[0]}</span>
                              <span className="font-semibold tabular-nums text-black dark:text-white">{dur(x.seconds)}</span>
                            </div>
                          ))}
                        <div className="mt-1.5 border-t border-black/10 pt-1.5 text-sm font-bold tabular-nums text-black dark:border-white/10 dark:text-white">{dur(d.total)} total</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {!list.length && <p className="mt-3 text-center text-sm text-zinc-400">No time tracked in this range. Press play on any board card to start.</p>}
          </>
        )}
      </Bento>

      {/* ---------- per member (table view of the chart) ---------- */}
      <Bento className="fade-up flex flex-col lg:col-span-4" style={{ animationDelay: '60ms' }}>
        <BentoHeader icon={<Users className="h-5 w-5" />} title="By teammate" subtitle={RANGES.find((r) => r.id === range)!.label} />
        <ul className="space-y-3">
          {perMember.map(({ m, seconds }) => (
            <li key={m.id}>
              <div className="mb-1 flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: seriesVar(memberIndex.get(m.id) ?? 0) }} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">{m.name}</span>
                <span className="text-sm font-bold tabular-nums text-black dark:text-white">{dur(seconds)}</span>
                <span className="w-10 text-right text-xs tabular-nums text-zinc-400">{total ? Math.round((seconds / total) * 100) : 0}%</span>
              </div>
            </li>
          ))}
          {!perMember.length && <li className="py-6 text-center text-sm text-zinc-400">Nobody has tracked time yet.</li>}
        </ul>

        <h4 className="mb-2 mt-6 text-sm font-bold text-black dark:text-white">Top cards</h4>
        <ul className="space-y-1.5">
          {perTask.map((t) => (
            <li key={t.id ?? 'none'}>
              <button
                disabled={!t.id}
                onClick={() => t.id && openTask(t.id)}
                className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-sm hover:bg-black/[0.03] disabled:hover:bg-transparent dark:hover:bg-white/[0.04]"
              >
                <span className="min-w-0 flex-1 truncate text-zinc-700 dark:text-zinc-300">{t.title}</span>
                <span className="font-semibold tabular-nums text-black dark:text-white">{dur(t.seconds)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Bento>

      {/* ---------- log time ---------- */}
      {canWrite && (
        <Bento className="fade-up lg:col-span-4" style={{ animationDelay: '120ms' }}>
          <BentoHeader icon={<Plus className="h-5 w-5" />} title="Log time" subtitle="Forgot the timer? Add it here." />
          <form onSubmit={submitLog} className="space-y-3">
            <div>
              <label className={labelCls}>Card</label>
              <select value={logTask} onChange={(e) => setLogTask(e.target.value)} className={inputCls}>
                <option value="">No card (focus time)</option>
                {tasks
                  .filter((t) => t.status !== 'DONE' || t.assigneeId === user.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" value={logDate} max={localDateStr(new Date())} onChange={(e) => setLogDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Started at</label>
                <input type="time" value={logStart} onChange={(e) => setLogStart(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Duration</label>
              <input value={logDur} onChange={(e) => setLogDur(e.target.value)} placeholder="1h 30m · 45m · 1:15" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Note (optional)</label>
              <input value={logNote} onChange={(e) => setLogNote(e.target.value)} placeholder="What did you work on?" maxLength={200} className={inputCls} />
            </div>
            <button type="submit" disabled={logBusy || !logDur.trim()} className={`${primaryBtn} w-full`}>
              {logBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Log {parseMinutes(logDur) ? dur(parseMinutes(logDur)! * 60) : 'time'}
            </button>
          </form>
        </Bento>
      )}

      {/* ---------- entries ---------- */}
      <Bento className={`fade-up flex flex-col ${canWrite ? 'lg:col-span-8' : 'lg:col-span-12'}`} style={{ animationDelay: '180ms' }}>
        <BentoHeader icon={<Timer className="h-5 w-5" />} title="Time log" subtitle={`${list.length} entr${list.length === 1 ? 'y' : 'ies'}`} />
        <div className="thin-scroll -mr-2 max-h-[32rem] space-y-5 overflow-y-auto pr-2">
          {grouped.map(([day, items]) => (
            <div key={day}>
              <div className="mb-2 flex items-baseline justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
                <span>{new Date(`${day}T00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                <span className="tabular-nums">{dur(items.reduce((s, e) => s + entrySeconds(e, now), 0))}</span>
              </div>
              <ul className={`${wellCls} divide-y divide-black/[0.06] dark:divide-white/[0.06]`}>
                {items.map((e) => (
                  <li key={e.id} className="group flex items-center gap-3 px-3.5 py-2.5">
                    <Avatar name={e.user.name} size="sm" className="!ring-0" />
                    <div className="min-w-0 flex-1">
                      <button
                        disabled={!e.task}
                        onClick={() => e.task && openTask(e.task.id)}
                        className="block max-w-full truncate text-left text-sm font-semibold text-black enabled:hover:underline dark:text-white"
                      >
                        {e.task?.title ?? e.note ?? 'Focus session'}
                      </button>
                      <div className="truncate text-xs text-zinc-500">
                        {e.user.name} · {new Date(e.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        {e.endedAt ? ` – ${new Date(e.endedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ' – now'}
                        {e.manual && ' · logged manually'}
                        {e.note && e.task && ` · ${e.note}`}
                      </div>
                    </div>
                    {e.endedAt ? (
                      <span className="font-mono text-sm font-semibold tabular-nums text-black dark:text-white">{dur(entrySeconds(e))}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> {clock(entrySeconds(e, now))}
                      </span>
                    )}
                    {(e.userId === user.id || isAdmin) && e.endedAt && (
                      <button onClick={() => void remove(e.id)} className="rounded-lg p-1.5 text-zinc-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100" aria-label="Delete entry">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {entries && !list.length && <p className="py-8 text-center text-sm text-zinc-400">Nothing logged in this range yet.</p>}
        </div>
      </Bento>
    </div>
  );
};

export default TimesheetView;
