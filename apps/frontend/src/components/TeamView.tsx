import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, Coffee, GitCommit, Loader2, Play, Radio, Sparkles, Timer } from 'lucide-react';
import { api } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { Avatar, Bento, BentoHeader, ghostBtn, wellCls } from './ui';
import { clock, dur, startOfDay, startOfWeek, useNow } from '../lib/workflow';
import type { TeamMemberPulse } from '../types';

/** A full working day — the goal the "today" bar fills towards (Goal-Gradient Effect). */
const DAY_GOAL = 8 * 3600;

const standupText = (members: TeamMemberPulse[]) =>
  [
    `Standup · ${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`,
    '',
    ...members.flatMap((m) => {
      const s = m.standup;
      const list = (xs: { title: string }[]) => (xs.length ? xs.map((x) => `  • ${x.title}`) : ['  • —']);
      return [
        `${m.user.name}  (${dur(s.trackedSeconds24h)} tracked, ${s.commits24h} commit${s.commits24h === 1 ? '' : 's'})`,
        ' Done:',
        ...list(s.done),
        ' Doing:',
        ...list(s.doing),
        ...(s.blockers.length ? [' Blockers (overdue):', ...list(s.blockers)] : []),
        '',
      ];
    }),
  ].join('\n');

export const TeamView: React.FC = () => {
  const { workspaceId, user, pulseVersion, presence, startTimer, myTimer, fail, toast, openTask } = useWorkspace();
  const [members, setMembers] = useState<TeamMemberPulse[] | null>(null);
  const now = useNow(1000);

  const load = useCallback(async () => {
    try {
      const r = await api.team(workspaceId, { dayStart: startOfDay().toISOString(), weekStart: startOfWeek().toISOString() });
      setMembers(r.members);
    } catch (err) {
      fail(err);
    }
  }, [workspaceId, fail]);

  // Live: refetch on every relevant realtime event (debounced) and once a minute.
  useEffect(() => {
    const t = window.setTimeout(() => void load(), pulseVersion ? 400 : 0);
    return () => window.clearTimeout(t);
  }, [load, pulseVersion]);
  useEffect(() => {
    const id = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  const onlineIds = new Set(presence.map((p) => p.userId));
  const liveSince = (m: TeamMemberPulse, from: Date) =>
    m.activeTimer ? Math.max(0, (now - Math.max(new Date(m.activeTimer.startedAt).getTime(), from.getTime())) / 1000) : 0;
  const today = (m: TeamMemberPulse) => m.todaySeconds + liveSince(m, startOfDay());
  const week = (m: TeamMemberPulse) => m.weekSeconds + liveSince(m, startOfWeek());

  if (!members) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-3xl bg-black/[0.04] dark:bg-white/[0.05]" />
        ))}
      </div>
    );
  }

  const working = members.filter((m) => m.activeTimer);
  const teamToday = members.reduce((s, m) => s + today(m), 0);
  const doneToday = members.reduce((s, m) => s + m.counts.doneToday, 0);
  const blockers = members.reduce((s, m) => s + m.counts.overdue, 0);

  return (
    <div className="space-y-5">
      {/* ---------- headline numbers ---------- */}
      <div className="fade-up grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { k: 'Working right now', v: `${working.length}/${members.length}`, icon: <Radio className="h-4 w-4 text-emerald-500" /> },
          { k: 'Team time today', v: dur(teamToday), icon: <Timer className="h-4 w-4 text-sky-500" /> },
          { k: 'Shipped today', v: doneToday, icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> },
          { k: 'Overdue cards', v: blockers, icon: <AlertTriangle className={`h-4 w-4 ${blockers ? 'text-red-500' : 'text-zinc-400'}`} /> },
        ].map((s) => (
          <Bento key={s.k} className="!p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {s.icon} {s.k}
            </div>
            <div className="mt-1.5 text-3xl font-extrabold tabular-nums tracking-tight text-black dark:text-white">{s.v}</div>
          </Bento>
        ))}
      </div>

      {/* ---------- member cards ---------- */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {members.map((m, i) => {
          const online = m.online || onlineIds.has(m.user.id);
          const t = today(m);
          const isMe = m.user.id === user.id;
          return (
            <Bento key={m.user.id} className="fade-up flex flex-col" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center gap-3">
                <Avatar name={m.user.name} size="md" online={online} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-bold text-black dark:text-white">
                    {m.user.name} {isMe && <span className="text-sm font-medium text-zinc-400">(you)</span>}
                  </div>
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    {m.role.toLowerCase()} · {online ? 'online' : 'offline'}
                  </div>
                </div>
              </div>

              {/* live status */}
              <div
                className={`mt-4 rounded-2xl border p-3.5 ${
                  m.activeTimer ? 'border-emerald-500/40 bg-emerald-500/[0.07]' : 'border-black/[0.07] bg-white/60 dark:border-white/[0.07] dark:bg-black/40'
                }`}
              >
                {m.activeTimer ? (
                  <button className="flex w-full items-center gap-3 text-left" onClick={() => m.activeTimer?.task && openTask(m.activeTimer.task.id)}>
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-emerald-700 dark:text-emerald-300">Working on</span>
                      <span className="block truncate text-sm font-semibold text-black dark:text-white">
                        {m.activeTimer.task?.title ?? m.activeTimer.note ?? 'Focus session'}
                      </span>
                    </span>
                    <span className="font-mono text-lg font-bold tabular-nums text-black dark:text-white">{clock((now - new Date(m.activeTimer.startedAt).getTime()) / 1000)}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <Coffee className="h-4 w-4 shrink-0 text-zinc-400" />
                    <span className="flex-1 text-sm text-zinc-500">{online ? 'Online, no timer running' : 'Not on the clock'}</span>
                    {isMe && !myTimer && (
                      <button onClick={() => void startTimer(null, 'Focus session')} className={`${ghostBtn} !py-1.5`}>
                        <Play className="h-3.5 w-3.5" /> Start
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* hours */}
              <div className="mt-4">
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                  <span className="font-semibold text-black dark:text-white">
                    {dur(t)} <span className="font-normal text-zinc-400">today</span>
                  </span>
                  <span className="text-zinc-500">{dur(week(m))} this week</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${Math.min(100, (t / DAY_GOAL) * 100)}%` }} />
                </div>
              </div>

              {/* workload */}
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                {[
                  { k: 'To do', v: m.counts.todo, c: 'text-zinc-700 dark:text-zinc-200' },
                  { k: 'Doing', v: m.counts.inProgress, c: 'text-amber-600 dark:text-amber-300' },
                  { k: 'Review', v: m.counts.review, c: 'text-violet-600 dark:text-violet-300' },
                  { k: 'Done today', v: m.counts.doneToday, c: 'text-emerald-600 dark:text-emerald-300' },
                ].map((c) => (
                  <div key={c.k} className={`${wellCls} px-1 py-2`}>
                    <div className={`text-lg font-bold tabular-nums ${c.c}`}>{c.v}</div>
                    <div className="text-[11px] font-medium text-zinc-500">{c.k}</div>
                  </div>
                ))}
              </div>
              {m.counts.overdue > 0 && (
                <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4" /> {m.counts.overdue} overdue card{m.counts.overdue === 1 ? '' : 's'}
                </p>
              )}
            </Bento>
          );
        })}
      </div>

      {/* ---------- autonomous standup ---------- */}
      <Bento className="fade-up">
        <BentoHeader
          icon={<Sparkles className="h-5 w-5" />}
          title="Daily standup"
          subtitle={
            <>
              From the last 24 hours of cards, timers and commits.{' '}
              <span className="hand text-lg text-emerald-600 dark:text-emerald-400">no meeting needed ✎</span>
            </>
          }
          action={
            <button
              onClick={() => {
                void navigator.clipboard.writeText(standupText(members)).then(
                  () => toast('success', 'Standup copied. Paste it in Slack or email.'),
                  () => toast('error', 'Could not access the clipboard')
                );
              }}
              className={ghostBtn}
            >
              <Copy className="h-4 w-4" /> <span className="hidden sm:inline">Copy as text</span>
            </button>
          }
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {members.map((m) => {
            const s = m.standup;
            const empty = !s.done.length && !s.doing.length && !s.blockers.length && !s.next.length;
            const block = (label: string, items: { id: string; title: string }[], tone: string) =>
              items.length > 0 && (
                <div>
                  <div className={`mb-1 text-xs font-bold uppercase tracking-wider ${tone}`}>{label}</div>
                  <ul className="space-y-1">
                    {items.map((x) => (
                      <li key={x.id}>
                        <button onClick={() => openTask(x.id)} className="w-full truncate text-left text-sm text-zinc-700 hover:text-black hover:underline dark:text-zinc-300 dark:hover:text-white">
                          {x.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            return (
              <div key={m.user.id} className={`${wellCls} p-4`}>
                <div className="mb-3 flex items-center gap-2.5">
                  <Avatar name={m.user.name} size="sm" className="!ring-0" />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-black dark:text-white">{m.user.name}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                    <Timer className="h-3.5 w-3.5" /> {dur(s.trackedSeconds24h)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                    <GitCommit className="h-3.5 w-3.5" /> {s.commits24h}
                  </span>
                </div>
                <div className="space-y-3">
                  {block('Done', s.done, 'text-emerald-600 dark:text-emerald-400')}
                  {block('Doing', s.doing, 'text-amber-600 dark:text-amber-400')}
                  {!s.doing.length && block('Up next', s.next.slice(0, 3), 'text-zinc-500')}
                  {block('Blockers', s.blockers, 'text-red-600 dark:text-red-400')}
                  {empty && <p className="text-sm text-zinc-400">No assigned cards yet.</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Bento>
      {!members.length && <Loader2 className="mx-auto h-5 w-5 animate-spin text-zinc-400" />}
    </div>
  );
};

export default TeamView;
