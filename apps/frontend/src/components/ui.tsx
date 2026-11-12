import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

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
      className={`relative shrink-0 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[Math.abs(hash(name)) % AVATAR_GRADIENTS.length]} ${dims} flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-black/20 ${className}`}
    >
      {initials(name)}
      {online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0c0d13]" />}
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
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 sm:w-96" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md ${
              t.kind === 'success'
                ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-100'
                : 'border-red-500/30 bg-red-950/90 text-red-100'
            }`}
          >
            {t.kind === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            )}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="opacity-60 hover:opacity-100">
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
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
    <div
      className={`modal-in w-full ${wide ? 'max-w-lg' : 'max-w-md'} rounded-2xl border border-zinc-800 bg-[#13151f] p-6 shadow-2xl`}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-base font-semibold text-white">{title}</h3>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-white" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  </div>
);

export const inputCls =
  'w-full rounded-lg border border-zinc-800 bg-[#090a0f] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition';
export const labelCls = 'mb-1.5 block text-sm font-medium text-zinc-400';
export const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-60';
export const ghostBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800 disabled:opacity-60';

// ---------------- Brand icon (lucide no longer ships brand logos) ----------------
export const GithubIcon: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);
