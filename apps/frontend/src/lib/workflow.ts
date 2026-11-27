import { useEffect, useState } from 'react';
import type { MeetingProvider, Task, TaskPriority, TaskStatus, TimeEntry } from '../types';

// ---------------- board metadata ----------------
export const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

export const STATUS_META: Record<TaskStatus, { label: string; dot: string; ring: string; hint: string }> = {
  TODO: { label: 'To Do', dot: 'bg-zinc-400', ring: 'ring-zinc-400/40', hint: 'Ideas and work that has not started' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-amber-500', ring: 'ring-amber-500/40', hint: 'Being worked on right now' },
  REVIEW: { label: 'Review', dot: 'bg-violet-500', ring: 'ring-violet-500/40', hint: 'Waiting for a second pair of eyes' },
  DONE: { label: 'Done', dot: 'bg-emerald-500', ring: 'ring-emerald-500/40', hint: 'Shipped' },
};

export const STATUS_PILL: Record<TaskStatus, string> = {
  TODO: 'border-black/10 bg-white text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300',
  IN_PROGRESS: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200',
  REVIEW: 'border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-200',
  DONE: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
};

export const PRIORITY_PILL: Record<TaskPriority, string> = {
  URGENT: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300',
  HIGH: 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-300',
  MEDIUM: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300',
  LOW: 'border-black/10 bg-zinc-100 text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300',
};

export const PROVIDER_META: Record<MeetingProvider, { label: string; short: string; tint: string }> = {
  INSTANT: { label: 'Instant room', short: 'Instant', tint: 'bg-emerald-500' },
  GOOGLE_MEET: { label: 'Google Meet', short: 'Meet', tint: 'bg-sky-500' },
  ZOOM: { label: 'Zoom', short: 'Zoom', tint: 'bg-blue-600' },
};

// ---------------- dates ----------------
/** Local YYYY-MM-DD (not UTC — avoids "overdue" flipping at midnight UTC). */
export const localDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const dueStr = (t: Pick<Task, 'dueDate'>) => (t.dueDate ? t.dueDate.slice(0, 10) : '');
export const isOverdue = (t: Pick<Task, 'dueDate' | 'status'>, today = localDateStr(new Date())) =>
  t.status !== 'DONE' && !!t.dueDate && dueStr(t) < today;

export const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
/** Monday 00:00 local. */
export const startOfWeek = (d = new Date()) => {
  const s = startOfDay(d);
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
  return s;
};

// ---------------- durations ----------------
/** 1:04:09 — for running clocks. */
export const clock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

/** 2h 05m / 12m — for totals. */
export const dur = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (!h && !m) return s ? '<1m' : '0m';
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
};

export const entrySeconds = (e: Pick<TimeEntry, 'startedAt' | 'endedAt'>, now = Date.now(), from?: number) => {
  const start = Math.max(new Date(e.startedAt).getTime(), from ?? -Infinity);
  const end = e.endedAt ? new Date(e.endedAt).getTime() : now;
  return Math.max(0, (end - start) / 1000);
};

/** Re-renders every `ms` so running timers tick. */
export const useNow = (ms = 1000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
};

/**
 * Lenient duration parser (Postel's Law): "90", "1h 30m", "1.5h", "1:30", "45m".
 * Returns minutes or null.
 */
export const parseMinutes = (raw: string): number | null => {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  const colon = v.match(/^(\d+):(\d{1,2})$/);
  if (colon) return Number(colon[1]) * 60 + Number(colon[2]);
  const hm = v.match(/^(?:(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?)?\s*(?:(\d+)\s*m(?:in(?:utes?)?)?)?$/);
  if (hm && (hm[1] || hm[2])) return Math.round(Number(hm[1] ?? 0) * 60 + Number(hm[2] ?? 0));
  if (/^\d+(\.\d+)?$/.test(v)) return Math.round(Number(v));
  return null;
};

/** Tiny celebration burst (Peak-End Rule) — pure DOM, no dependency. */
export const celebrate = (x = window.innerWidth / 2, y = window.innerHeight / 2) => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#f43f5e'];
  for (let i = 0; i < 28; i++) {
    const el = document.createElement('span');
    const angle = (Math.PI * 2 * i) / 28 + Math.random() * 0.4;
    const dist = 60 + Math.random() * 90;
    el.className = 'confetti-bit';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.background = colors[i % colors.length]!;
    el.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    el.style.setProperty('--dy', `${Math.sin(angle) * dist - 40}px`);
    el.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
    document.body.appendChild(el);
    window.setTimeout(() => el.remove(), 950);
  }
};
