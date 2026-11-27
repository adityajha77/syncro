import React, { useEffect, useRef, useState } from 'react';

/**
 * Brand pieces shared by the marketing site and the app so every page speaks
 * the same visual language: hand-drawn notes on top of a clean, precise UI —
 * "your workflow, sketched and shipped in one place".
 */

// ---------------- Typewriter with dissolving backspace ----------------
/**
 * Types each phrase letter by letter (each letter fades up in), pauses, then
 * deletes — the deleted letters blur and fade away instead of vanishing.
 */
export const TypewriterFade: React.FC<{ phrases: string[]; className?: string; caretClass?: string; typeMs?: number; deleteMs?: number; holdMs?: number }> = ({
  phrases,
  className = '',
  caretClass = 'bg-current',
  typeMs = 70,
  deleteMs = 38,
  holdMs = 1600,
}) => {
  const [i, setI] = useState(0);
  const [count, setCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const phrase = phrases[i % phrases.length]!;
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reduced) return;
    let t: number;
    if (!deleting && count < phrase.length) t = window.setTimeout(() => setCount((c) => c + 1), typeMs + Math.random() * 40);
    else if (!deleting) t = window.setTimeout(() => setDeleting(true), holdMs);
    else if (count > 0) t = window.setTimeout(() => setCount((c) => c - 1), deleteMs);
    else
      t = window.setTimeout(() => {
        setDeleting(false);
        setI((x) => x + 1);
      }, 320); // let the last letters finish dissolving
    return () => window.clearTimeout(t);
  }, [count, deleting, phrase, typeMs, deleteMs, holdMs, reduced]);

  if (reduced) return <span className={className}>{phrases[0]}</span>;

  // While deleting, keep a short trail of letters rendered so they can fade out.
  const trail = deleting ? Math.min(phrase.length, count + 7) : count;
  // An invisible copy of the longest phrase reserves the width, so the text
  // around the typewriter never shifts — only the typed letters change.
  const longest = phrases.reduce((a, b) => (b.length > a.length ? b : a), '');
  return (
    <span className={`relative inline-block whitespace-nowrap text-left align-bottom ${className}`} aria-label={phrase}>
      <span className="invisible" aria-hidden="true">
        {longest}
        <span className="caret ml-[2px] h-[0.9em]" />
      </span>
      <span aria-hidden="true" className="absolute inset-y-0 left-0">
        {Array.from(phrase.slice(0, trail)).map((ch, idx) => (
          <span key={`${i}-${idx}`} className={idx < count ? 'char-in' : 'char-out'}>
            {ch}
          </span>
        ))}
        <span className={`caret h-[0.9em] translate-y-[0.1em] ${caretClass}`} />
      </span>
    </span>
  );
};

// ---------------- Hand-drawn strokes ----------------
/** Strokes draw themselves the first time they scroll into view. */
function useDrawOnView<T extends Element>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          el.classList.add('is-visible');
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
/** Marker-style underline that draws itself under a word. */
export const Scribble: React.FC<{ className?: string; color?: string; delay?: string }> = ({ className = '', color = 'currentColor', delay = '0.6s' }) => {
  const ref = useDrawOnView<SVGSVGElement>();
  return (
    <svg ref={ref} viewBox="0 0 300 24" preserveAspectRatio="none" className={`pointer-events-none ${className}`} aria-hidden="true">
      <path
        className="draw-path"
        style={{ '--len': 340, '--delay': delay } as React.CSSProperties}
        d="M4 16 C 60 6, 120 4, 180 9 S 270 16, 296 7"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
};

/** Loose hand-drawn ellipse to circle something important. */
export const HandCircle: React.FC<{ className?: string; color?: string; delay?: string }> = ({ className = '', color = 'currentColor', delay = '0.3s' }) => {
  const ref = useDrawOnView<SVGSVGElement>();
  return (
    <svg ref={ref} viewBox="0 0 200 80" preserveAspectRatio="none" className={`pointer-events-none ${className}`} aria-hidden="true">
      <path
        className="draw-path"
        style={{ '--len': 560, '--delay': delay } as React.CSSProperties}
        d="M150 8 C 190 14, 198 46, 160 64 C 120 80, 40 78, 14 58 C -6 40, 20 12, 70 7 C 100 4, 130 5, 168 14"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
};

/** Curvy arrow; `flip` mirrors it horizontally. */
export const HandArrow: React.FC<{ className?: string; flip?: boolean; delay?: string }> = ({ className = '', flip, delay = '0.5s' }) => {
  const ref = useDrawOnView<SVGSVGElement>();
  return (
    <svg ref={ref} viewBox="0 0 120 80" className={`pointer-events-none ${flip ? '-scale-x-100' : ''} ${className}`} aria-hidden="true">
      <path
        className="draw-path"
        style={{ '--len': 200, '--delay': delay } as React.CSSProperties}
        d="M6 10 C 30 60, 70 70, 106 52"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        className="draw-path"
        style={{ '--len': 40, '--delay': `calc(${delay} + 0.8s)` } as React.CSSProperties}
        d="M92 42 L 107 52 L 92 62"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/** A handwritten note in the margin. */
export const HandNote: React.FC<{ children: React.ReactNode; className?: string; rotate?: number }> = ({ children, className = '', rotate = -3 }) => (
  <span
    className={`hand inline-block ${/(^|\s)!?text-(red|emerald|amber|sky|zinc|black|white)-?/.test(className) ? '' : 'text-zinc-500 dark:text-zinc-400'} ${className}`}
    style={{ transform: `rotate(${rotate}deg)` }}
  >
    {children}
  </span>
);

/** Sticky-note card, slightly rotated, with a strip of "tape". */
export const StickyNote: React.FC<{ children: React.ReactNode; className?: string; rotate?: number; tone?: 'amber' | 'emerald' | 'sky' }> = ({
  children,
  className = '',
  rotate = -2,
  tone = 'amber',
}) => {
  const tones = {
    amber: 'bg-amber-100 text-amber-950 dark:bg-amber-300/90',
    emerald: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-300/90',
    sky: 'bg-sky-100 text-sky-950 dark:bg-sky-300/90',
  };
  return (
    <div
      className={`float-y relative rounded-sm px-4 pb-3 pt-4 shadow-lg shadow-black/10 ${tones[tone]} ${className}`}
      style={{ '--rot': `${rotate}deg` } as React.CSSProperties}
    >
      <span className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 rotate-[-3deg] bg-white/60 shadow-sm dark:bg-white/40" />
      <div className="hand text-xl leading-tight">{children}</div>
    </div>
  );
};

// ---------------- Scroll reveal ----------------
export const useReveal = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          el.classList.add('is-visible');
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
};

export const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number; as?: 'div' | 'section' | 'li' }> = ({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
}) => {
  const ref = useReveal<HTMLDivElement>();
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={`reveal ${className}`} style={{ '--delay': `${delay}ms` } as React.CSSProperties}>
      {children}
    </Tag>
  );
};

// ---------------- Tilt ----------------
/** Tilts its child toward the cursor (max `max` degrees). Pairs with Bento's spotlight. */
export const Tilt: React.FC<{ children: React.ReactNode; className?: string; max?: number }> = ({ children, className = '', max = 6 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${px * max}deg`);
    el.style.setProperty('--rx', `${-py * max}deg`);
  };
  const reset = () => {
    ref.current?.style.setProperty('--rx', '0deg');
    ref.current?.style.setProperty('--ry', '0deg');
  };
  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={reset} className={`tilt ${className}`}>
      {children}
    </div>
  );
};

// ---------------- Logo ----------------
/** Syncro mark: two arrows chasing each other around one shared center — everything in sync, in one place. */
export const SyncroMark: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M4.6 11.2A7.5 7.5 0 0 1 17.4 6.4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M18.2 2.9v3.9h-3.9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.4 12.8A7.5 7.5 0 0 1 6.6 17.6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M5.8 21.1v-3.9h3.9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="2.3" fill="#10b981" />
  </svg>
);

// ---------------- Integration marks (brand colors) ----------------
export const GoogleCalendarMark: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="3.5" fill="#fff" stroke="#dadce0" />
    <path d="M3 7.2V6.5A3.5 3.5 0 0 1 6.5 3h11A3.5 3.5 0 0 1 21 6.5v.7z" fill="#4285f4" />
    <text x="12" y="17.6" textAnchor="middle" fontSize="8.5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#1a73e8">
      31
    </text>
  </svg>
);
export const MeetMark: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect x="2.5" y="6" width="13" height="12" rx="2.5" fill="#00ac47" />
    <path d="M15.5 10.2 21 6.8v10.4l-5.5-3.4z" fill="#00832d" />
    <rect x="2.5" y="6" width="5" height="12" rx="2.5" fill="#0066da" opacity=".9" />
    <rect x="9" y="6" width="6.5" height="4" rx="1.5" fill="#ffba00" opacity=".95" />
  </svg>
);
export const ZoomMark: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10.5" fill="#2d8cff" />
    <rect x="5.6" y="8.6" width="8.6" height="6.8" rx="1.8" fill="#fff" />
    <path d="m14.8 11 3.6-2.4v6.8L14.8 13z" fill="#fff" />
  </svg>
);
