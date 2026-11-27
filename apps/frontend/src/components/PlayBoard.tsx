import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { GripVertical, Pause, RotateCcw } from 'lucide-react';
import { Avatar } from './ui';
import { HandArrow, HandNote } from './brand';
import { celebrate, clock, useNow } from '../lib/workflow';

/**
 * A real, playable mini board for the home page (Paradox of the Active User:
 * people learn by doing). Drag a card to In Progress and its timer starts;
 * drop it in Done for a little celebration.
 */
type Col = 'todo' | 'doing' | 'done';
type Card = { id: string; title: string; tag: string; who: string; tint: string; col: Col; startedAt?: number; seconds: number };

const START: Card[] = [
  { id: 'c1', title: 'Design the landing page', tag: 'Design', who: 'Aarav Mehta', tint: 'bg-violet-500', col: 'todo', seconds: 0 },
  { id: 'c2', title: 'Write launch email', tag: 'Growth', who: 'Priya Sharma', tint: 'bg-emerald-500', col: 'todo', seconds: 0 },
  { id: 'c3', title: 'Realtime notifications', tag: 'Backend', who: 'Rohan Iyer', tint: 'bg-sky-500', col: 'doing', seconds: 2830, startedAt: Date.now() },
  { id: 'c4', title: 'Mobile nav polish', tag: 'Frontend', who: 'Sara Khan', tint: 'bg-rose-500', col: 'doing', seconds: 640 },
  { id: 'c5', title: 'Set up the workspace', tag: 'Ops', who: 'Aarav Mehta', tint: 'bg-amber-500', col: 'done', seconds: 3720 },
];

const COLS: { id: Col; label: string; dot: string; ring: string; hint: string }[] = [
  { id: 'todo', label: 'To Do', dot: 'bg-zinc-400', ring: 'ring-zinc-400/50', hint: '' },
  { id: 'doing', label: 'In Progress', dot: 'bg-amber-500', ring: 'ring-amber-500/50', hint: 'timer starts here' },
  { id: 'done', label: 'Done', dot: 'bg-emerald-500', ring: 'ring-emerald-500/50', hint: 'drop to ship 🎉' },
];

const elapsed = (c: Card, now: number) => c.seconds + (c.startedAt && c.col === 'doing' ? (now - c.startedAt) / 1000 : 0);

const CardFace: React.FC<{ c: Card; now: number; overlay?: boolean; invite?: boolean }> = ({ c, now, overlay, invite }) => {
  const live = c.col === 'doing' && c.startedAt;
  return (
    <div
      className={`rounded-xl border bg-white p-2.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-shadow dark:bg-zinc-950 ${
        live ? 'border-emerald-500/50 ring-2 ring-emerald-500/15' : 'border-black/[0.08] dark:border-white/[0.08]'
      } ${overlay ? 'rotate-[2deg] cursor-grabbing shadow-2xl' : 'cursor-grab hover:border-black/25 hover:shadow-md dark:hover:border-white/25'} ${
        invite ? 'animate-wiggle' : ''
      } ${c.col === 'done' ? 'opacity-75' : ''}`}
    >
      {live && (
        <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          {c.who.split(' ')[0]} · <span className="font-mono tabular-nums">{clock(elapsed(c, now))}</span>
        </div>
      )}
      <div className="flex items-start gap-1.5">
        <GripVertical className="mt-0.5 hidden h-3 w-3 shrink-0 text-zinc-300 dark:text-zinc-700 sm:block" />
        <span className={`text-[12px] font-semibold leading-tight text-zinc-900 dark:text-zinc-100 sm:text-[13px] ${c.col === 'done' ? 'line-through decoration-zinc-400' : ''}`}>
          {c.title}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-1">
        <span className="hidden items-center gap-1 rounded-md border border-black/10 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-white/10 sm:flex">
          <span className={`h-1.5 w-1.5 rounded-full ${c.tint}`} /> {c.tag}
        </span>
        {c.col === 'done' && c.seconds > 0 && <span className="font-mono text-[10px] text-zinc-400">{clock(c.seconds)}</span>}
        <Avatar name={c.who} size="xs" className="!h-5 !w-5 !text-[8px] !ring-1" />
      </div>
    </div>
  );
};

const DraggableCard: React.FC<{ c: Card; now: number; invite: boolean }> = ({ c, now, invite }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: c.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={`touch-none select-none ${isDragging ? 'opacity-30' : ''}`} aria-label={`Drag "${c.title}"`}>
      <CardFace c={c} now={now} invite={invite && !isDragging} />
    </div>
  );
};

const Column: React.FC<{ col: (typeof COLS)[number]; cards: Card[]; now: number; dragging: boolean; invite: boolean }> = ({ col, cards, now, dragging, invite }) => {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[15rem] min-w-0 flex-col rounded-2xl border p-2 transition ${
        isOver ? `border-transparent bg-white ring-2 dark:bg-zinc-950 ${col.ring}` : 'border-black/[0.06] bg-white/60 dark:border-white/[0.06] dark:bg-black/40'
      }`}
    >
      <div className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-bold text-zinc-700 dark:text-zinc-200">
        <span className={`h-2 w-2 shrink-0 rounded-full ${col.dot}`} /> <span className="truncate">{col.label}</span>
        <span className="ml-auto text-zinc-400">{cards.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {cards.map((c, i) => (
          <DraggableCard key={c.id} c={c} now={now} invite={invite && col.id === 'todo' && i === 0} />
        ))}
        {dragging && col.hint && (
          <div className="hand flex flex-1 items-center justify-center rounded-xl border border-dashed border-black/15 px-2 py-3 text-center text-lg leading-tight text-zinc-400 dark:border-white/15">
            {col.hint}
          </div>
        )}
      </div>
    </div>
  );
};

export const PlayBoard: React.FC = () => {
  const now = useNow(1000);
  const [cards, setCards] = useState<Card[]>(START);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [moves, setMoves] = useState(0);
  const shipped = cards.filter((c) => c.col === 'done').length - 1;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const onStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;
    const to = over.id as Col;
    const card = cards.find((c) => c.id === active.id);
    if (!card || card.col === to) return;
    setMoves((m) => m + 1);
    setCards((list) => [
      ...list.filter((c) => c.id !== card.id),
      {
        ...card,
        col: to,
        // Leaving In Progress banks the time; entering it starts the clock.
        seconds: card.col === 'doing' ? elapsed(card, Date.now()) : card.seconds,
        startedAt: to === 'doing' ? Date.now() : undefined,
      },
    ]);
    if (to === 'done') {
      const r = active.rect.current.translated;
      celebrate(r ? r.left + r.width / 2 : undefined, r ? r.top + r.height / 2 : undefined);
    }
  };

  const running = cards.filter((c) => c.col === 'doing' && c.startedAt);
  const active = cards.find((c) => c.id === activeId);

  return (
    <div className="relative">
      {/* invitation */}
      <div className={`pointer-events-none absolute -top-14 left-2 z-10 flex items-end gap-1 transition-opacity duration-500 sm:left-10 ${moves ? 'opacity-0' : 'opacity-100'}`}>
        <HandNote className="text-2xl text-emerald-600 dark:text-emerald-400" rotate={-4}>
          psst — it&apos;s real. drag a card!
        </HandNote>
        <HandArrow className="h-12 w-14 rotate-[25deg] text-emerald-500" delay="1.4s" />
      </div>

      <div className="overflow-hidden rounded-[1.4rem] border border-black/10 bg-zinc-50 shadow-2xl shadow-black/10 dark:border-white/10 dark:bg-zinc-900/60 dark:shadow-black/60">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-black/[0.07] bg-white/80 px-4 py-2.5 dark:border-white/[0.07] dark:bg-black/60">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 hidden rounded-md bg-black/[0.04] px-3 py-0.5 font-mono text-[11px] text-zinc-500 dark:bg-white/[0.06] sm:block">syncro.app/board</span>
          <span className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:text-red-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> Sprint sync · Join
          </span>
          {running[0] && (
            <span className="hidden items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300 sm:flex">
              <Pause className="h-3 w-3" /> {clock(elapsed(running[running.length - 1]!, now))}
            </span>
          )}
        </div>

        <DndContext sensors={sensors} onDragStart={onStart} onDragEnd={onEnd} onDragCancel={() => setActiveId(null)}>
          <div className="grid grid-cols-3 gap-2 p-2.5 sm:gap-3 sm:p-4">
            {COLS.map((col) => (
              <Column key={col.id} col={col} cards={cards.filter((c) => c.col === col.id)} now={now} dragging={!!activeId} invite={!moves} />
            ))}
          </div>
          {createPortal(<DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>{active ? <CardFace c={active} now={now} overlay /> : null}</DragOverlay>, document.body)}
        </DndContext>

        {/* footer: feedback on what they just did (Peak-End) */}
        <div className="flex min-h-[44px] items-center gap-3 border-t border-black/[0.07] bg-white/70 px-4 py-2 text-sm dark:border-white/[0.07] dark:bg-black/40">
          <span className="hand text-xl text-zinc-500 dark:text-zinc-400">
            {shipped > 0 ? `you shipped ${shipped} card${shipped === 1 ? '' : 's'} — your team would see it live ✨` : moves ? 'nice! now try dropping one in Done' : 'every move here shows up for your whole team'}
          </span>
          {moves > 0 && (
            <button
              onClick={() => {
                setCards(START.map((c) => ({ ...c, startedAt: c.startedAt ? Date.now() : undefined })));
                setMoves(0);
              }}
              className="ml-auto inline-flex min-h-[32px] shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-zinc-500 hover:bg-black/5 hover:text-black dark:hover:bg-white/10 dark:hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayBoard;
