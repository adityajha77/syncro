import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, X, Sun, Moon, Palette } from 'lucide-react';
import { THEMES, useTheme } from '../context/ThemeContext';

/**
 * Syncro app design system — mirrors the marketing site:
 * black/white surfaces, zinc-50/950 cards, hairline black/10 · white/10 borders,
 * rounded-3xl bento tiles, emerald as the single accent.
 */

// ---------------- Class tokens ----------------
export const inputCls =
  'w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition focus:border-black/30 focus:outline-none focus:ring-4 focus:ring-black/5 dark:border-white/10 dark:bg-black dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:border-white/30 dark:focus:ring-white/5';
export const labelCls = 'mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-400';
export const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200';
export const ghostBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-black/25 hover:text-black active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-white/25 dark:hover:text-white';
export const subtleText = 'text-zinc-500 dark:text-zinc-400';
export const titleText = 'text-zinc-900 dark:text-white';
/** Inner well inside a bento tile (lists, empty states). */
export const wellCls = 'rounded-2xl border border-black/[0.06] bg-white/70 dark:border-white/[0.06] dark:bg-black/40';
export const chipCls =
  'rounded-lg border border-black/10 bg-white px-2 py-0.5 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300';

// ---------------- Bento card with cursor spotlight ----------------
type BentoProps = React.HTMLAttributes<HTMLElement> & { as?: 'div' | 'section' | 'article'; pad?: boolean };

/** Rounded tile; a soft light follows the cursor and highlights the border (see .bento in index.css). */
export const Bento: React.FC<BentoProps> = ({ as = 'section', pad = true, className = '', children, onMouseMove, ...rest }) => {
  const Tag = as as React.ElementType;
  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
    onMouseMove?.(e);
  };
  return (
    <Tag
      onMouseMove={handleMove}
      className={`bento rounded-3xl border border-black/10 bg-zinc-50/80 shadow-sm backdrop-blur-sm transition-colors duration-300 dark:border-white/10 dark:bg-zinc-950/70 ${pad ? 'p-6' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
};

// ---------------- Icon tiles ----------------
export type Tone = 'emerald' | 'sky' | 'violet' | 'amber' | 'rose' | 'ink';
const TONES: Record<Tone, string> = {
  emerald: 'from-emerald-400 to-teal-600 shadow-emerald-500/30',
  sky: 'from-sky-400 to-blue-600 shadow-sky-500/30',
  violet: 'from-violet-400 to-purple-600 shadow-violet-500/30',
  amber: 'from-amber-300 to-orange-500 shadow-amber-500/30',
  rose: 'from-rose-400 to-pink-600 shadow-rose-500/30',
  ink: 'from-zinc-700 to-black shadow-black/20 dark:from-zinc-600 dark:to-zinc-800',
};

/** Glossy gradient tile for icons — one tone per kind of thing, used everywhere. */
export const IconTile: React.FC<{ tone?: Tone; size?: 'sm' | 'md' | 'lg'; className?: string; children: React.ReactNode }> = ({ tone = 'ink', size = 'md', className = '', children }) => {
  const dims = { sm: 'h-8 w-8 rounded-lg', md: 'h-10 w-10 rounded-xl', lg: 'h-12 w-12 rounded-2xl' }[size];
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center bg-gradient-to-br text-white shadow-lg ring-1 ring-inset ring-white/25 ${TONES[tone]} ${dims} ${className}`}
    >
      <span className="pointer-events-none absolute inset-x-1 top-0.5 h-1/2 rounded-[inherit] bg-gradient-to-b from-white/30 to-transparent" />
      <span className="relative">{children}</span>
    </div>
  );
};

/** Picks a tone from the header title so the same kind of card always gets the same color. */
const toneFor = (title: string): Tone => {
  const t = title.toLowerCase();
  if (/health|deliverable|task|card|standup/.test(t)) return 'emerald';
  if (/calendar|meeting|schedule|upcoming|recent|activity/.test(t)) return 'sky';
  if (/team|teammate|workspace|join|account/.test(t)) return 'violet';
  if (/time|hour|timer|log/.test(t)) return 'amber';
  if (/security|password/.test(t)) return 'rose';
  return 'ink';
};

export const BentoHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: React.ReactNode; action?: React.ReactNode; tone?: Tone }> = ({
  icon,
  title,
  subtitle,
  action,
  tone,
}) => (
  <div className="mb-5 flex items-start justify-between gap-3">
    <div className="flex min-w-0 items-center gap-3">
      <IconTile tone={tone ?? toneFor(title)}>{icon}</IconTile>
      <div className="min-w-0">
        <h2 className={`truncate font-hand text-[1.7rem] font-bold leading-tight ${titleText}`}>{title}</h2>
        {subtitle && <div className={`truncate text-sm ${subtleText}`}>{subtitle}</div>}
      </div>
    </div>
    {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
  </div>
);

/** Fixed page backdrop: faded grid (like the home hero) + spotlights that follow the cursor. */
export const AppBackdrop: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        ref.current?.style.setProperty('--px', `${e.clientX}px`);
        ref.current?.style.setProperty('--py', `${e.clientY}px`);
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 bg-grid-pattern mask-radial opacity-70 dark:opacity-100" />
      <div ref={ref} className="app-backdrop" />
    </>
  );
};

// ---------------- Theme picker (light · dark · blush · sky · lavender) ----------------
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, isDark, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  const tinted = theme !== 'light' && theme !== 'dark';
  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-zinc-100 text-zinc-700 transition-all hover:scale-105 hover:border-black/20 active:scale-95 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-white/30"
        title="Change theme"
        aria-label="Change theme"
        aria-expanded={open}
      >
        {tinted ? <Palette className="h-4 w-4" style={{ color: THEMES.find((t) => t.id === theme)?.ring }} /> : isDark ? <Moon className="h-4 w-4 text-sky-300" /> : <Sun className="h-4 w-4 text-amber-500" />}
      </button>
      {open && (
        <div className="modal-in absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-black/10 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-zinc-950">
          <div className="hand px-2 pb-1 pt-0.5 text-lg text-zinc-500 dark:text-zinc-400">pick your vibe</div>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setTheme(t.id, { x: r.left + 20, y: r.top + r.height / 2 });
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-medium transition ${
                theme === t.id ? 'bg-zinc-100 text-black dark:bg-zinc-900 dark:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-black dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white'
              }`}
            >
              <span className="h-6 w-6 shrink-0 rounded-full border-2 shadow-inner" style={{ background: t.swatch, borderColor: t.ring }} />
              <span className="flex-1">{t.label}</span>
              {theme === t.id && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------- Animated numbers ----------------
/** True once the element has scrolled into view (never flips back). */
export const useSeenOnce = <T extends Element>() => {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen] as const;
};

/** Counts from 0 up to `value` the first time it is seen; afterwards it just shows the value. */
export const CountUp: React.FC<{ value: number; suffix?: string; duration?: number; className?: string }> = ({ value, suffix = '', duration = 1300, className = '' }) => {
  const [ref, seen] = useSeenOnce<HTMLSpanElement>();
  const [shown, setShown] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (!seen) return;
    if (done.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      done.current = true;
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
      else done.current = true;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, value, duration]);
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {shown}
      {suffix}
    </span>
  );
};

// ---------------- Ring gauge ----------------
/** Ring sweeps from empty to `value` the first time it is seen (pair with <CountUp/> inside). */
export const RingGauge: React.FC<{ value: number; size?: number; stroke?: number; tone?: 'good' | 'warn' | 'bad'; children?: React.ReactNode }> = ({
  value,
  size = 132,
  stroke = 10,
  tone = 'good',
  children,
}) => {
  const [ref, seen] = useSeenOnce<HTMLDivElement>();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = { good: '#10b981', warn: '#f59e0b', bad: '#ef4444' }[tone];
  const pct = seen ? Math.max(0, Math.min(100, value)) : 0;
  return (
    <div ref={ref} className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-black/[0.07] dark:stroke-white/10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.33, 1, 0.68, 1)', filter: `drop-shadow(0 0 6px ${color}55)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
};

// ---------------- Avatar ----------------
const AVATAR_GRADIENTS = [
  'from-violet-500 to-fuchsia-500',
  'from-sky-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-cyan-500 to-blue-500',
  'from-lime-500 to-emerald-500',
];

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('') || '?';

/** Colorful initials avatar; the color is stable per name. */
export const Avatar: React.FC<{ name: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; online?: boolean; className?: string; title?: string }> = ({
  name,
  size = 'sm',
  online,
  className = '',
  title,
}) => {
  const dims = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg', xl: 'h-20 w-20 text-2xl' }[size];
  return (
    <div
      title={title ?? name}
      className={`relative shrink-0 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[Math.abs(hash(name)) % AVATAR_GRADIENTS.length]} ${dims} flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white dark:ring-black ${className}`}
    >
      {initials(name)}
      {online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black" />}
    </div>
  );
};

// ---------------- Toasts ----------------
interface Toast {
  id: number;
  kind: 'success' | 'error';
  message: string;
}
const ToastContext = createContext<(kind: Toast['kind'], message: string) => void>(() => {});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 6000 : 3500);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 left-4 right-4 z-[100] flex flex-col gap-2 sm:left-auto sm:w-96" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast-in flex items-start gap-2.5 rounded-2xl border border-black/10 bg-white/95 px-4 py-3 text-sm text-zinc-800 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/95 dark:text-zinc-100"
          >
            {t.kind === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            )}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="opacity-50 hover:opacity-100" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

// ---------------- Modal shell ----------------
export const Modal: React.FC<{ title: string; icon?: React.ReactNode; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({
  title,
  icon,
  onClose,
  children,
  wide,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm dark:bg-black/70" onClick={onClose}>
      <div
        className={`modal-in w-full ${wide ? 'max-w-lg' : 'max-w-md'} rounded-3xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-950`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-black/10 pb-4 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            {icon}
            <h3 className={`font-hand text-2xl font-bold leading-tight ${titleText}`}>{title}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-black dark:hover:bg-zinc-900 dark:hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
};

// ---------------- Brand icon (lucide no longer ships brand logos) ----------------
export const GithubIcon: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);
