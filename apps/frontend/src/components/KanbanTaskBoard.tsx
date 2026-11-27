import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle, CalendarClock, CheckSquare, Loader2, MessageSquare, Pause, Play, Plus, Search, Timer, X } from 'lucide-react';
import { api } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { Avatar, chipCls, inputCls } from './ui';
import { PRIORITY_PILL, STATUSES, STATUS_META, celebrate, clock, dur, entrySeconds, isOverdue, localDateStr, useNow } from '../lib/workflow';
import type { Task, TaskPriority, TaskStatus, TimeEntry } from '../types';

/** More than this many cards in progress is a smell — the board says so (WIP limit). */
const WIP_LIMIT = 5;

type Columns = Record<TaskStatus, string[]>;

const byPosition = (a: Task, b: Task) => a.position - b.position || b.createdAt.localeCompare(a.createdAt);

const buildColumns = (tasks: Task[]): Columns => {
  const cols: Columns = { TODO: [], IN_PROGRESS: [], REVIEW: [], DONE: [] };
  [...tasks].sort(byPosition).forEach((t) => cols[t.status].push(t.id));
  return cols;
};

const findColumn = (cols: Columns, id: string): TaskStatus | null => {
  if ((STATUSES as string[]).includes(id)) return id as TaskStatus;
  return STATUSES.find((s) => cols[s].includes(id)) ?? null;
};

// ==========================================
// CARD
// ==========================================
interface CardProps {
  task: Task;
  timers: TimeEntry[];
  now: number;
  onOpen?: () => void;
  onToggleTimer?: () => void;
  mineRunning?: boolean;
  canWrite: boolean;
  overlay?: boolean;
}

export const TaskCard: React.FC<CardProps> = ({ task, timers, now, onOpen, onToggleTimer, mineRunning, canWrite, overlay }) => {
  const today = localDateStr(new Date(now));
  const overdue = isOverdue(task, today);
  const live = timers.filter((t) => t.taskId === task.id);
  const liveSeconds = live.reduce((s, e) => s + entrySeconds(e, now), 0);
  const tracked = task.trackedSeconds + liveSeconds;
  const est = task.estimateMinutes ? task.estimateMinutes * 60 : 0;
  const checklistPct = task.checklistTotal ? Math.round((task.checklistDone / task.checklistTotal) * 100) : 0;

  return (
    <div
      onClick={onOpen}
      className={`group relative cursor-pointer select-none rounded-2xl border bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition dark:bg-zinc-950 ${
        live.length ? 'border-emerald-500/50 ring-2 ring-emerald-500/15' : 'border-black/[0.08] hover:border-black/25 dark:border-white/[0.08] dark:hover:border-white/25'
      } ${overlay ? 'rotate-[1.5deg] cursor-grabbing shadow-2xl' : ''} ${task.status === 'DONE' ? 'opacity-80' : ''}`}
    >
      {live.length > 0 && (
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="truncate">
            {live.map((l) => l.user.name.split(' ')[0]).join(', ')} working · <span className="font-mono tabular-nums">{clock(liveSeconds)}</span>
          </span>
        </div>
      )}

      <div className="flex items-start gap-2">
        <p className={`min-w-0 flex-1 break-words text-[0.95rem] font-semibold leading-snug text-zinc-900 dark:text-zinc-100 ${task.status === 'DONE' ? 'line-through decoration-zinc-400/70' : ''}`}>
          {task.title}
        </p>
        {canWrite && task.status !== 'DONE' && onToggleTimer && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleTimer();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title={mineRunning ? 'Stop your timer' : 'Start a timer on this card'}
            aria-label={mineRunning ? 'Stop timer' : 'Start timer'}
            className={`-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition ${
              mineRunning
                ? 'border-emerald-500/40 bg-emerald-500 text-white'
                : 'border-transparent text-zinc-400 opacity-100 hover:border-black/10 hover:bg-zinc-100 hover:text-black sm:opacity-0 sm:group-hover:opacity-100 dark:hover:border-white/10 dark:hover:bg-zinc-900 dark:hover:text-white'
            }`}
          >
            {mineRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${PRIORITY_PILL[task.priority]}`}>{task.priority}</span>
        {task.label && <span className={`${chipCls} !text-[11px]`}>{task.label}</span>}
      </div>

      {task.checklistTotal > 0 && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
            <div
              className={`h-full rounded-full transition-all ${checklistPct === 100 ? 'bg-emerald-500' : 'bg-zinc-800 dark:bg-zinc-200'}`}
              style={{ width: `${checklistPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
        {task.dueDate && (
          <span className={`inline-flex items-center gap-1 ${overdue ? 'font-semibold text-red-600 dark:text-red-400' : ''}`}>
            {overdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
            {new Date(task.dueDate.slice(0, 10) + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
        {task.checklistTotal > 0 && (
          <span className={`inline-flex items-center gap-1 ${checklistPct === 100 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
            <CheckSquare className="h-3.5 w-3.5" /> {task.checklistDone}/{task.checklistTotal}
          </span>
        )}
        {task.commentCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" /> {task.commentCount}
          </span>
        )}
        {(tracked > 0 || est > 0) && (
          <span className={`inline-flex items-center gap-1 tabular-nums ${est && tracked > est ? 'text-amber-600 dark:text-amber-400' : ''}`}>
            <Timer className="h-3.5 w-3.5" />
            {tracked > 0 ? dur(tracked) : <span className="text-zinc-400">{dur(est)} est</span>}
            {tracked > 0 && est > 0 && <span className="text-zinc-400">/ {dur(est)}</span>}
          </span>
        )}
        <span className="ml-auto">{task.assignee ? <Avatar name={task.assignee.name} size="xs" className="!ring-1" /> : null}</span>
      </div>
    </div>
  );
};

const SortableCard: React.FC<Omit<CardProps, 'overlay'>> = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.task.id,
    disabled: !props.canWrite,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`touch-manipulation ${isDragging ? 'opacity-30' : ''} ${props.canWrite ? 'cursor-grab active:cursor-grabbing' : ''}`}
      {...attributes}
      {...listeners}
    >
      <TaskCard {...props} />
    </div>
  );
};

// ==========================================
// COLUMN
// ==========================================
const Column: React.FC<{
  status: TaskStatus;
  ids: string[];
  taskMap: Map<string, Task>;
  children: (task: Task) => React.ReactNode;
  canWrite: boolean;
  onAdd: (status: TaskStatus, title: string) => Promise<void>;
  trackedSeconds: number;
  loading: boolean;
}> = ({ status, ids, taskMap, children, canWrite, onAdd, trackedSeconds, loading }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = STATUS_META[status];
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const overWip = status === 'IN_PROGRESS' && ids.length > WIP_LIMIT;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await onAdd(status, title.trim());
      setTitle('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`flex w-[85vw] shrink-0 snap-start flex-col rounded-3xl border bg-zinc-50/80 p-3 backdrop-blur-sm transition sm:w-[20rem] lg:w-auto lg:min-w-0 dark:bg-zinc-950/70 ${
        isOver ? `border-transparent ring-2 ${meta.ring}` : 'border-black/[0.07] dark:border-white/[0.07]'
      }`}
    >
      <div className="mb-3 flex items-center gap-2 px-1.5 pt-1" title={meta.hint}>
        <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{meta.label}</h3>
        <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-600 dark:border-white/10 dark:bg-black dark:text-zinc-300">
          {ids.length}
        </span>
        {trackedSeconds > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs tabular-nums text-zinc-400">
            <Timer className="h-3.5 w-3.5" /> {dur(trackedSeconds)}
          </span>
        )}
      </div>
      {overWip && (
        <p className="mx-1 mb-2 flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {ids.length} in flight. Finish something before starting more.
        </p>
      )}

      <SortableContext id={status} items={ids} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="thin-scroll -mr-1 flex min-h-[8rem] flex-1 flex-col gap-2.5 overflow-y-auto pr-1 lg:max-h-[calc(100vh-19rem)]">
          {ids.map((id) => {
            const t = taskMap.get(id);
            return t ? <React.Fragment key={id}>{children(t)}</React.Fragment> : null;
          })}
          {loading && ids.length === 0 && [0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-black/[0.05] dark:bg-white/[0.06]" />)}
          {!loading && ids.length === 0 && (
            <div className="hand flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 px-4 py-8 text-center text-xl leading-tight text-zinc-400 dark:border-white/10">
              {status === 'TODO' ? 'nothing planned yet — add the first card ↓' : `drag cards here when they're ${meta.label.toLowerCase()}`}
            </div>
          )}
        </div>
      </SortableContext>

      {canWrite &&
        (adding ? (
          <form onSubmit={submit} className="mt-2.5 space-y-2">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
              placeholder="What needs doing?"
              className={inputCls}
              maxLength={200}
            />
            <div className="flex gap-2">
              <button type="submit" disabled={busy || !title.trim()} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add card
              </button>
              <button type="button" onClick={() => setAdding(false)} className="rounded-xl px-3 py-2 text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10" aria-label="Cancel">
                <X className="h-4 w-4" />
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-2.5 flex min-h-[44px] items-center gap-2 rounded-2xl px-3 text-sm font-medium text-zinc-500 transition hover:bg-black/[0.04] hover:text-black dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            <Plus className="h-4 w-4" /> Add a card
          </button>
        ))}
    </div>
  );
};

// ==========================================
// BOARD
// ==========================================
export const KanbanTaskBoard: React.FC = () => {
  const { workspaceId, user, tasks, setTasks, canWrite, loading, activeTimers, myTimer, startTimer, stopTimer, openTask, fail, members } = useWorkspace();
  const now = useNow(1000);

  // ---- filters (few, high-value choices: Hick's Law) ----
  const [query, setQuery] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [assignee, setAssignee] = useState('');
  const filtering = !!(query || onlyMine || priority || assignee);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        (!q || t.title.toLowerCase().includes(q) || t.label?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)) &&
        (!onlyMine || t.assigneeId === user.id) &&
        (!priority || t.priority === priority) &&
        (!assignee || (assignee === 'none' ? !t.assigneeId : t.assigneeId === assignee))
    );
  }, [tasks, query, onlyMine, priority, assignee, user.id]);

  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const baseColumns = useMemo(() => buildColumns(visible), [visible]);
  // While dragging we move ids between columns locally; null = follow server state.
  const [dragCols, setDragCols] = useState<Columns | null>(null);
  const columns = dragCols ?? baseColumns;
  const [activeId, setActiveId] = useState<string | null>(null);
  const dragFrom = useRef<TaskStatus | null>(null);
  const colsRef = useRef(columns);
  colsRef.current = columns;

  /**
   * Which column is the pointer in? Then the nearest card inside it.
   * (Corner-based detection alone tends to pick the column container itself,
   * which breaks re-ordering near the top of a list.)
   */
  const collision: CollisionDetection = (args) => {
    const col = pointerWithin(args).find((h) => (STATUSES as string[]).includes(String(h.id)));
    if (!col) return closestCorners(args);
    const ids = new Set(colsRef.current[col.id as TaskStatus]);
    const p = args.pointerCoordinates;
    if (!p) return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter((c) => ids.has(String(c.id))) });
    let best: (typeof args.droppableContainers)[number] | null = null;
    let bestD = Infinity;
    for (const c of args.droppableContainers) {
      if (!ids.has(String(c.id))) continue;
      const r = args.droppableRects.get(c.id);
      if (!r) continue;
      const d = Math.abs(r.top + r.height / 2 - p.y);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best ? [{ id: best.id, data: { droppableContainer: best, value: bestD } }] : [col];
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
    setDragCols(baseColumns);
    dragFrom.current = findColumn(baseColumns, String(e.active.id));
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    setDragCols((cols) => {
      if (!cols) return cols;
      const from = findColumn(cols, String(active.id));
      const to = findColumn(cols, String(over.id));
      if (!from || !to) return cols;
      if (from === to) {
        // Same column: follow the pointer live, so the drop just commits what is shown.
        const ids = cols[to];
        const a = ids.indexOf(String(active.id));
        const b = ids.indexOf(String(over.id));
        return a < 0 || b < 0 || a === b ? cols : { ...cols, [to]: arrayMove(ids, a, b) };
      }
      const fromIds = cols[from].filter((id) => id !== active.id);
      const toIds = [...cols[to]];
      const overIndex = toIds.indexOf(String(over.id));
      toIds.splice(overIndex >= 0 ? overIndex : toIds.length, 0, String(active.id));
      return { ...cols, [from]: fromIds, [to]: toIds };
    });
  };

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    const cols = dragCols;
    setActiveId(null);
    const id = String(active.id);
    if (!cols || !over) return setDragCols(null);

    const to = findColumn(cols, id)!;
    let ids = cols[to];
    const overIdx = ids.indexOf(String(over.id));
    const curIdx = ids.indexOf(id);
    if (overIdx >= 0 && overIdx !== curIdx) ids = arrayMove(ids, curIdx, overIdx);
    const from = dragFrom.current;
    if (from === to && ids.join() === baseColumns[to].join()) return setDragCols(null);

    // Map the visible (maybe filtered) order onto the full column for the server index.
    const visIdx = ids.indexOf(id);
    const fullColumn = tasks.filter((t) => t.status === to && t.id !== id).sort(byPosition).map((t) => t.id);
    const prev = ids[visIdx - 1];
    const next = ids[visIdx + 1];
    const index = prev ? fullColumn.indexOf(prev) + 1 : next ? Math.max(0, fullColumn.indexOf(next)) : fullColumn.length;

    // Optimistic: re-number locally so the card stays where it was dropped (Doherty Threshold).
    const snapshot = tasks;
    const order = [...fullColumn];
    order.splice(index, 0, id);
    const pos = new Map(order.map((tid, i) => [tid, i * 1024]));
    setTasks((list) =>
      list.map((t) =>
        pos.has(t.id)
          ? {
              ...t,
              position: pos.get(t.id)!,
              ...(t.id === id && { status: to, completedAt: to === 'DONE' ? t.completedAt ?? new Date().toISOString() : null }),
            }
          : t
      )
    );
    setDragCols(null);

    if (to === 'DONE' && from !== 'DONE') {
      const r = active.rect.current.translated;
      celebrate(r ? r.left + r.width / 2 : undefined, r ? r.top + r.height / 2 : undefined);
    }
    try {
      await api.moveTask(workspaceId, id, to, index);
    } catch (err) {
      setTasks(snapshot);
      fail(err);
    }
  };

  const addCard = async (status: TaskStatus, title: string) => {
    try {
      const t = await api.createTask(workspaceId, { title, status });
      setTasks((p) => (p.some((x) => x.id === t.id) ? p : [t, ...p]));
    } catch (err) {
      fail(err);
    }
  };

  const toggleTimer = (task: Task) => (myTimer?.taskId === task.id ? stopTimer() : startTimer(task.id));

  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const activeTask = activeId ? taskMap.get(activeId) : null;
  const colTracked = (s: TaskStatus) =>
    columns[s].reduce((sum, id) => {
      const t = taskMap.get(id);
      return t ? sum + t.trackedSeconds + activeTimers.filter((a) => a.taskId === id).reduce((x, e) => x + entrySeconds(e, now), 0) : sum;
    }, 0);

  const selectCls =
    'min-h-[40px] rounded-xl border border-black/10 bg-white px-3 text-sm text-zinc-700 shadow-sm focus:outline-none dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200';

  return (
    <div className="fade-up">
      {/* ---------- toolbar ---------- */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cards, labels…" className={`${inputCls} !pl-10`} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setOnlyMine((v) => !v)}
            className={`min-h-[40px] rounded-xl border px-3.5 text-sm font-medium shadow-sm transition ${
              onlyMine ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black' : 'border-black/10 bg-white text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200'
            }`}
          >
            My cards
          </button>
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={selectCls} aria-label="Filter by assignee">
            <option value="">Everyone</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
            <option value="none">Unassigned</option>
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority | '')} className={selectCls} aria-label="Filter by priority">
            <option value="">Any priority</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          {filtering && (
            <button
              onClick={() => {
                setQuery('');
                setOnlyMine(false);
                setPriority('');
                setAssignee('');
              }}
              className="min-h-[40px] rounded-xl px-3 text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white"
            >
              Clear · {visible.length}/{total}
            </button>
          )}
        </div>
        {/* Goal-gradient: how close the board is to done */}
        <div className="flex items-center gap-3 lg:ml-auto lg:w-64">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">
            {doneCount}/{total} done
          </span>
        </div>
      </div>

      {/* ---------- columns ---------- */}
      <DndContext sensors={sensors} collisionDetection={collision} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={() => (setDragCols(null), setActiveId(null))}>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {STATUSES.map((s) => (
            <Column key={s} status={s} ids={columns[s]} taskMap={taskMap} canWrite={canWrite} onAdd={addCard} trackedSeconds={colTracked(s)} loading={loading}>
              {(task) => (
                <SortableCard
                  task={task}
                  timers={activeTimers}
                  now={now}
                  canWrite={canWrite}
                  onOpen={() => openTask(task.id)}
                  mineRunning={myTimer?.taskId === task.id}
                  onToggleTimer={() => void toggleTimer(task)}
                />
              )}
            </Column>
          ))}
        </div>
        {/* Portal: an ancestor with a CSS transform would offset the fixed-position overlay from the cursor. */}
        {createPortal(
          <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
            {activeTask ? <TaskCard task={activeTask} timers={activeTimers} now={now} canWrite={canWrite} overlay /> : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
};

export default KanbanTaskBoard;
