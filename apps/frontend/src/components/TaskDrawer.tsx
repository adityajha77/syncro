import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckSquare,
  Clock,
  Loader2,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Send,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { Avatar, ghostBtn, inputCls, labelCls } from './ui';
import { PRIORITY_PILL, STATUSES, STATUS_META, STATUS_PILL, celebrate, clock, dur, entrySeconds, parseMinutes, useNow } from '../lib/workflow';
import type { TaskDetail, TaskPriority, TaskStatus } from '../types';

const timeAgo = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const sectionTitle = 'mb-3 flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white';

export const TaskDrawer: React.FC<{ taskId: string; onClose: () => void }> = ({ taskId, onClose }) => {
  const { workspaceId, tasks, setTasks, members, canWrite, user, isAdmin, activeTimers, myTimer, startTimer, stopTimer, fail, toast, detailVersion, setMeetings } =
    useWorkspace();
  const card = tasks.find((t) => t.id === taskId);
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimate, setEstimate] = useState('');
  const [newItem, setNewItem] = useState('');
  const [comment, setComment] = useState('');
  const [logAmount, setLogAmount] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const now = useNow(1000);

  const load = useCallback(async () => {
    try {
      setDetail(await api.taskDetail(workspaceId, taskId));
    } catch (err) {
      fail(err);
      onClose();
    }
  }, [workspaceId, taskId, fail, onClose]);

  // Refetch when anyone changes comments / checklist / time on this card.
  const version = detailVersion[taskId] ?? 0;
  const liveKey = activeTimers
    .filter((t) => t.taskId === taskId)
    .map((t) => t.id)
    .join();
  useEffect(() => {
    void load();
  }, [load, version, card?.trackedSeconds, liveKey]);

  // Seed editable fields once per task (don't clobber typing on live updates).
  const [seeded, setSeeded] = useState<string | null>(null);
  useEffect(() => {
    if (card && seeded !== card.id) {
      setTitle(card.title);
      setDescription(card.description ?? '');
      setEstimate(card.estimateMinutes ? dur(card.estimateMinutes * 60) : '');
      setSeeded(card.id);
    }
  }, [card, seeded]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!card) return null;

  const patch = async (p: Parameters<typeof api.updateTask>[2]) => {
    const snapshot = tasks;
    setTasks((list) => list.map((t) => (t.id === card.id ? { ...t, ...p } as typeof t : t)));
    try {
      const t = await api.updateTask(workspaceId, card.id, p);
      setTasks((list) => list.map((x) => (x.id === t.id ? t : x)));
      if (p.status === 'DONE' && card.status !== 'DONE') {
        celebrate();
        toast('success', 'Shipped! Card moved to Done 🎉');
      }
    } catch (err) {
      setTasks(snapshot);
      fail(err);
    }
  };

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await fn();
      await load();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${card.title}"? Its checklist, comments and time log go with it.`)) return;
    try {
      await api.deleteTask(workspaceId, card.id);
      setTasks((list) => list.filter((t) => t.id !== card.id));
      onClose();
    } catch (err) {
      fail(err);
    }
  };

  const startCall = () =>
    run('call', async () => {
      const m = await api.createMeeting(workspaceId, { title: card.title, provider: 'INSTANT', taskId: card.id });
      setMeetings((list) => (list.some((x) => x.id === m.id) ? list : [...list, m]));
      window.open(m.joinUrl, '_blank', 'noopener');
    });

  const live = activeTimers.filter((t) => t.taskId === card.id);
  const liveSeconds = live.reduce((s, e) => s + entrySeconds(e, now), 0);
  const tracked = card.trackedSeconds + liveSeconds;
  const est = (card.estimateMinutes ?? 0) * 60;
  const mineRunning = myTimer?.taskId === card.id;
  const checklist = detail?.checklist ?? [];
  const doneItems = checklist.filter((c) => c.done).length;
  const checklistPct = checklist.length ? Math.round((doneItems / checklist.length) * 100) : 0;
  const ro = !canWrite;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[2px] dark:bg-black/60" onClick={onClose}>
      <aside
        className="drawer-in thin-scroll flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={card.title}
      >
        {/* ---------- header ---------- */}
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-black/10 bg-white/90 px-5 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-xl border border-black/10 bg-zinc-100 p-1 dark:border-white/10 dark:bg-black">
            {STATUSES.map((s) => (
              <button
                key={s}
                disabled={ro}
                onClick={() => s !== card.status && void patch({ status: s as TaskStatus })}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  card.status === s ? 'bg-white text-black shadow-sm dark:bg-zinc-800 dark:text-white' : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`} /> {STATUS_META[s].label}
              </button>
            ))}
          </div>
          {canWrite && (
            <button onClick={remove} className="rounded-xl p-2.5 text-zinc-400 hover:bg-red-500/10 hover:text-red-500" title="Delete card" aria-label="Delete card">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button onClick={onClose} className="rounded-xl p-2.5 text-zinc-400 hover:bg-zinc-100 hover:text-black dark:hover:bg-zinc-900 dark:hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-7 px-5 py-5">
          {/* ---------- title + description ---------- */}
          <div>
            <textarea
              value={title}
              readOnly={ro}
              rows={Math.max(1, Math.ceil(title.length / 34))}
              onChange={(e) => setTitle(e.target.value.replace(/\n/g, ''))}
              onBlur={() => title.trim() && title.trim() !== card.title && void patch({ title: title.trim() })}
              className="w-full resize-none overflow-hidden bg-transparent text-2xl font-extrabold leading-tight tracking-tight text-black focus:outline-none dark:text-white"
              aria-label="Title"
            />
            <p className="mt-1 text-xs text-zinc-400">
              Created by {card.createdBy.name} · {timeAgo(card.createdAt)}
            </p>
            <textarea
              value={description}
              readOnly={ro}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => description !== (card.description ?? '') && void patch({ description })}
              placeholder={ro ? 'No description' : 'Add more detail: context, links, acceptance criteria…'}
              rows={3}
              className={`${inputCls} mt-4 resize-y`}
            />
          </div>

          {/* ---------- properties ---------- */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Assignee</label>
              <select
                disabled={ro}
                value={card.assigneeId ?? ''}
                onChange={(e) => void patch({ assigneeId: e.target.value || null })}
                className={inputCls}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.id === user.id ? ' (you)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select
                disabled={ro}
                value={card.priority}
                onChange={(e) => void patch({ priority: e.target.value as TaskPriority })}
                className={`${inputCls} font-semibold ${PRIORITY_PILL[card.priority]}`}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Due date</label>
              <input
                type="date"
                disabled={ro}
                value={card.dueDate ? card.dueDate.slice(0, 10) : ''}
                onChange={(e) => void patch({ dueDate: e.target.value ? `${e.target.value}T00:00:00.000Z` : null })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Label</label>
              <input
                disabled={ro}
                defaultValue={card.label ?? ''}
                key={card.label ?? ''}
                onBlur={(e) => e.target.value.trim() !== (card.label ?? '') && void patch({ label: e.target.value.trim() })}
                placeholder="e.g. Frontend"
                maxLength={60}
                className={inputCls}
              />
            </div>
          </div>

          {/* ---------- time tracking ---------- */}
          <section>
            <h4 className={sectionTitle}>
              <Clock className="h-4 w-4" /> Time
            </h4>
            <div className="rounded-2xl border border-black/[0.08] p-4 dark:border-white/[0.08]">
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-3xl font-bold tabular-nums text-black dark:text-white">{mineRunning ? clock(entrySeconds(myTimer!, now)) : dur(tracked)}</div>
                  <div className="text-xs text-zinc-500">
                    {mineRunning ? `this session · ${dur(tracked)} total` : 'tracked in total'}
                    {live.filter((l) => l.userId !== user.id).length > 0 && ` · ${live.filter((l) => l.userId !== user.id).map((l) => l.user.name).join(', ')} working now`}
                  </div>
                </div>
                {canWrite && card.status !== 'DONE' && (
                  <button
                    onClick={() => void (mineRunning ? stopTimer() : startTimer(card.id))}
                    className={`inline-flex min-h-[48px] items-center gap-2 rounded-2xl px-5 text-sm font-bold shadow-lg transition active:scale-[0.97] ${
                      mineRunning ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'
                    }`}
                  >
                    {mineRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {mineRunning ? 'Stop' : 'Start timer'}
                  </button>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Estimate</label>
                  <input
                    disabled={ro}
                    value={estimate}
                    onChange={(e) => setEstimate(e.target.value)}
                    onBlur={() => {
                      const m = estimate.trim() ? parseMinutes(estimate) : null;
                      if (estimate.trim() && m === null) return toast('error', 'Try an estimate like "2h", "90m" or "1:30"');
                      if (m !== card.estimateMinutes) void patch({ estimateMinutes: m });
                      setEstimate(m ? dur(m * 60) : '');
                    }}
                    placeholder="e.g. 2h 30m"
                    className={inputCls}
                  />
                </div>
                {canWrite && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const m = parseMinutes(logAmount);
                      if (!m) return toast('error', 'Enter time like "45m", "1h 15m" or "1:15"');
                      void run('log', async () => {
                        await api.logTime(workspaceId, { taskId: card.id, minutes: m, startedAt: new Date(Date.now() - m * 60_000).toISOString() });
                        setLogAmount('');
                        toast('success', `Logged ${dur(m * 60)}`);
                      });
                    }}
                  >
                    <label className={labelCls}>Log time</label>
                    <div className="flex gap-2">
                      <input value={logAmount} onChange={(e) => setLogAmount(e.target.value)} placeholder="45m" className={inputCls} />
                      <button type="submit" disabled={!logAmount.trim() || busy === 'log'} className={`${ghostBtn} !px-3`} aria-label="Log time">
                        {busy === 'log' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {est > 0 && (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-zinc-500">
                    <span>{Math.round((tracked / est) * 100)}% of estimate</span>
                    <span>{tracked > est ? `${dur(tracked - est)} over` : `${dur(est - tracked)} left`}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
                    <div className={`h-full rounded-full ${tracked > est ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (tracked / est) * 100)}%` }} />
                  </div>
                </div>
              )}

              {!!detail?.timeEntries.length && (
                <ul className="mt-4 space-y-1.5 border-t border-black/[0.06] pt-3 dark:border-white/[0.06]">
                  {detail.timeEntries.slice(0, 6).map((e) => (
                    <li key={e.id} className="flex items-center gap-2 text-sm">
                      <Avatar name={e.user.name} size="xs" className="!ring-0" />
                      <span className="min-w-0 flex-1 truncate text-zinc-600 dark:text-zinc-300">
                        {e.user.name.split(' ')[0]} {e.endedAt ? (e.manual ? 'logged' : 'tracked') : 'is tracking'}
                      </span>
                      <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">{e.endedAt ? dur(entrySeconds(e)) : clock(entrySeconds(e, now))}</span>
                      <span className="w-20 text-right text-xs text-zinc-400">{timeAgo(e.startedAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* ---------- checklist ---------- */}
          <section>
            <h4 className={sectionTitle}>
              <CheckSquare className="h-4 w-4" /> Checklist
              {checklist.length > 0 && (
                <span className={`ml-auto text-xs font-semibold tabular-nums ${checklistPct === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>
                  {doneItems}/{checklist.length}
                </span>
              )}
            </h4>
            {checklist.length > 0 && (
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${checklistPct}%` }} />
              </div>
            )}
            <ul className="space-y-1">
              {checklist.map((item) => (
                <li key={item.id} className="group flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
                  <input
                    type="checkbox"
                    checked={item.done}
                    disabled={ro}
                    onChange={() => {
                      setDetail((d) => d && { ...d, checklist: d.checklist.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c)) });
                      if (!item.done && doneItems + 1 === checklist.length) celebrate();
                      void run(item.id, () => api.updateChecklistItem(workspaceId, card.id, item.id, { done: !item.done }));
                    }}
                    className="h-5 w-5 shrink-0 cursor-pointer accent-emerald-500"
                  />
                  <span className={`flex-1 text-sm ${item.done ? 'text-zinc-400 line-through' : 'text-zinc-800 dark:text-zinc-200'}`}>{item.text}</span>
                  {canWrite && (
                    <button
                      onClick={() => void run(item.id, () => api.deleteChecklistItem(workspaceId, card.id, item.id))}
                      className="rounded-lg p-1 text-zinc-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                      aria-label="Remove item"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {canWrite && (
              <form
                className="mt-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const text = newItem.trim();
                  if (!text) return;
                  setNewItem('');
                  void run('item', () => api.addChecklistItem(workspaceId, card.id, text));
                }}
              >
                <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add a step…" className={inputCls} maxLength={300} />
                <button type="submit" disabled={!newItem.trim()} className={`${ghostBtn} !px-3`} aria-label="Add step">
                  {busy === 'item' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </button>
              </form>
            )}
          </section>

          {/* ---------- call ---------- */}
          {canWrite && (
            <button
              onClick={startCall}
              disabled={busy === 'call'}
              className="flex w-full items-center gap-3 rounded-2xl border border-black/[0.08] p-4 text-left transition hover:border-black/25 dark:border-white/[0.08] dark:hover:border-white/25"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black">
                {busy === 'call' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Video className="h-5 w-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-black dark:text-white">Start a call about this card</span>
                <span className="block text-xs text-zinc-500">Opens an instant video room and tells your team to join.</span>
              </span>
            </button>
          )}

          {/* ---------- comments ---------- */}
          <section>
            <h4 className={sectionTitle}>
              <MessageSquare className="h-4 w-4" /> Discussion
              {!!detail?.comments.length && <span className="ml-auto text-xs font-semibold text-zinc-500">{detail.comments.length}</span>}
            </h4>
            <ul className="space-y-4">
              {detail?.comments.map((c) => (
                <li key={c.id} className="group flex gap-3">
                  <Avatar name={c.author.name} size="sm" className="!ring-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-black dark:text-white">{c.author.name}</span>
                      <span className="text-xs text-zinc-400">{timeAgo(c.createdAt)}</span>
                      {(c.author.id === user.id || isAdmin) && (
                        <button
                          onClick={() => void run(c.id, () => api.deleteComment(workspaceId, card.id, c.id))}
                          className="ml-auto text-xs text-zinc-400 opacity-0 hover:text-red-500 group-hover:opacity-100"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words rounded-2xl rounded-tl-md bg-zinc-100 px-3.5 py-2.5 text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                      {c.body}
                    </p>
                  </div>
                </li>
              ))}
              {detail && !detail.comments.length && <li className="text-sm text-zinc-400">No comments yet. Ask a question or share an update.</li>}
              {!detail && <li className="h-16 animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.05]" />}
            </ul>
            <form
              className="mt-4 flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const body = comment.trim();
                if (!body) return;
                setComment('');
                void run('comment', () => api.addComment(workspaceId, card.id, body));
              }}
            >
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) (e.currentTarget.form as HTMLFormElement).requestSubmit();
                }}
                placeholder="Write a comment… (Ctrl+Enter to send)"
                rows={2}
                className={`${inputCls} resize-none`}
              />
              <button type="submit" disabled={!comment.trim() || busy === 'comment'} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white disabled:opacity-40 dark:bg-white dark:text-black" aria-label="Send comment">
                {busy === 'comment' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </section>
        </div>

        <div className="border-t border-black/10 px-5 py-3 text-xs text-zinc-400 dark:border-white/10">
          <span className={`mr-2 rounded-md border px-1.5 py-0.5 font-semibold ${STATUS_PILL[card.status]}`}>{STATUS_META[card.status].label}</span>
          Updated {timeAgo(card.updatedAt)}
        </div>
      </aside>
    </div>
  );
};

export default TaskDrawer;
