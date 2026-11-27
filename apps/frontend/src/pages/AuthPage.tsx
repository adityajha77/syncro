import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, MousePointerClick, Sparkles, SquareKanban, Timer, Video } from 'lucide-react';
import { api } from '../services/api';
import { HandArrow, HandNote, Scribble, SyncroMark } from '../components/brand';
import { useAuth } from '../context/AuthContext';
import { AppBackdrop, Bento, IconTile, ThemeToggle, inputCls, labelCls, primaryBtn } from '../components/ui';

/** Only allow in-app redirect targets (blocks open redirects like //evil.com). */
export const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/app');

export const AuthPage: React.FC<{ mode: 'SIGN_IN' | 'SIGN_UP' }> = ({ mode }) => {
  const { status, login, signup, loginDemo } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  useEffect(() => {
    api.demoAvailable().then((r) => setDemo(r.available), () => setDemo(false));
  }, []);

  const openDemo = async () => {
    setError(null);
    setDemoBusy(true);
    try {
      await loginDemo();
      navigate('/app?view=board', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the demo');
      setDemoBusy(false);
    }
  };

  if (status === 'authenticated') return <Navigate to={next} replace />;

  const isSignUp = mode === 'SIGN_UP';
  const otherLink = `${isSignUp ? '/login' : '/signup'}${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isSignUp && !name.trim()) return setError('Please enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Please enter a valid email address.');
    if (isSignUp && password.length < 8) return setError('Password must be at least 8 characters.');
    if (!password) return setError('Please enter your password.');
    setBusy(true);
    try {
      if (isSignUp) await signup(name.trim(), email.trim(), password);
      else await login(email.trim(), password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  const pillars = [
    { tone: 'emerald' as const, icon: <SquareKanban className="h-4 w-4" />, title: 'Drag-and-drop board', text: 'To Do → Review → Done, updated live for everyone.' },
    { tone: 'amber' as const, icon: <Timer className="h-4 w-4" />, title: 'Live timers', text: 'See who is working on what, right now.' },
    { tone: 'violet' as const, icon: <Sparkles className="h-4 w-4" />, title: 'Standups, auto-written', text: 'Done, doing and blockers from real work.' },
    { tone: 'sky' as const, icon: <Video className="h-4 w-4" />, title: 'Meetings built in', text: 'Instant rooms, Google Meet and Zoom.' },
  ];

  return (
    <div className="hand-site relative flex min-h-screen flex-col overflow-hidden bg-white text-zinc-900 antialiased transition-colors duration-300 selection:bg-black selection:text-white dark:bg-black dark:text-zinc-100 dark:selection:bg-white dark:selection:text-black">
      <AppBackdrop />

      {/* Top bar — same anatomy as the site navbar */}
      <header className="relative z-20 border-b border-black/10 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-black/75">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white shadow-sm transition-transform group-hover:scale-105 dark:bg-white dark:text-black">
              <SyncroMark className="h-6 w-6" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-black dark:text-white">Syncro</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="group hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-black dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white sm:inline-flex"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to home
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full flex-1 max-w-6xl items-center gap-8 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:gap-12">
        {/* ---------- Form ---------- */}
        <div className="fade-up mx-auto w-full max-w-md">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            {isSignUp ? 'Free while in beta' : 'Welcome back'}
          </span>
          <h1 className="font-hand text-[2.6rem] font-bold leading-none text-black dark:text-white sm:text-5xl">
            {isSignUp ? 'Create your workspace' : 'Sign in to Syncro'}
          </h1>
          <p className="mb-4 mt-1 text-base text-zinc-500 dark:text-zinc-400">
            {isSignUp ? 'Tasks, commits and calendars — finally in one place.' : 'Pick up exactly where your team left off.'}
          </p>

          <Bento className="!p-6 shadow-xl">
            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={submit} className="space-y-3">
              {isSignUp && (
                <div>
                  <label className={labelCls}>Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoComplete="name" className={inputCls} />
                </div>
              )}
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? 'At least 8 characters' : 'Your password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  className={inputCls}
                />
              </div>

              <button type="submit" disabled={busy} className={`${primaryBtn} mt-2 w-full !py-3`}>
                {isSignUp ? 'Create account' : 'Sign in'}
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            {demo && (
              <>
                <div className="my-3 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
                  <span className="h-px flex-1 bg-black/10 dark:bg-white/10" /> or <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                </div>
                <button
                  type="button"
                  onClick={openDemo}
                  disabled={demoBusy}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/[0.07] px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-500/[0.12] disabled:opacity-60 dark:text-emerald-200"
                >
                  {demoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MousePointerClick className="h-4 w-4" />}
                  Try the live demo — no signup
                </button>
              </>
            )}

            <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Link to={otherLink} className="font-semibold text-black underline-offset-4 hover:underline dark:text-white">
                {isSignUp ? 'Sign in' : 'Sign up'}
              </Link>
            </p>
          </Bento>
        </div>

        {/* ---------- Showcase (desktop) ---------- */}
        <Bento className="fade-up relative hidden overflow-hidden !p-8 lg:block" style={{ animationDelay: '120ms' }}>
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <h2 className="text-[2.4rem] font-bold leading-[1] text-black dark:text-white">
            Stop Switching.
            <br />
            <span className="relative inline-block">
              <span className="inline-block pb-[0.12em] text-black dark:text-white">
                Start Syncing.
              </span>
              <Scribble className="absolute -bottom-1 left-[40%] h-3 w-[58%] text-emerald-500" />
            </span>
          </h2>
          <p className="mt-3 max-w-md text-base text-zinc-500 dark:text-zinc-400">
            Board, timers, standups and calls — one tab, always live.
          </p>
          <div className="mt-1 flex items-end gap-1">
            <HandNote className="text-xl text-emerald-600 dark:text-emerald-400" rotate={-3}>
              your whole workflow, one place
            </HandNote>
            <HandArrow className="h-8 w-12 rotate-[20deg] text-zinc-400" />
          </div>
          <ul className="mt-4 space-y-2">
            {pillars.map((p) => (
              <li key={p.title} className="flex items-center gap-3 rounded-2xl border border-black/[0.07] bg-white px-3.5 py-2 dark:border-white/[0.07] dark:bg-black/50">
                <IconTile tone={p.tone} size="sm">{p.icon}</IconTile>
                <div className="min-w-0">
                  <div className="font-hand text-lg font-bold leading-tight text-black dark:text-white">{p.title}</div>
                  <div className="truncate text-xs leading-snug text-zinc-500 dark:text-zinc-400">{p.text}</div>
                </div>
              </li>
            ))}
          </ul>
        </Bento>
      </main>
    </div>
  );
};
