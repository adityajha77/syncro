import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, AlertCircle, ArrowLeft, ArrowRight, CalendarDays, Gauge, Layers, Loader2, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppBackdrop, Bento, ThemeToggle, inputCls, labelCls, primaryBtn } from '../components/ui';

/** Only allow in-app redirect targets (blocks open redirects like //evil.com). */
export const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/app');

export const AuthPage: React.FC<{ mode: 'SIGN_IN' | 'SIGN_UP' }> = ({ mode }) => {
  const { status, login, signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    { icon: <Zap className="h-4 w-4" />, title: 'Zero-lag collaboration', text: 'Live presence and instant updates across your team.' },
    { icon: <Activity className="h-4 w-4" />, title: 'Unified activity ledger', text: 'Commits, tasks and events in one timeline.' },
    { icon: <Gauge className="h-4 w-4" />, title: 'Workspace health', text: 'Know what is on track and what is overdue.' },
    { icon: <CalendarDays className="h-4 w-4" />, title: 'GitHub + Google Calendar', text: 'Your real work, connected in one place.' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-white font-sans text-zinc-900 antialiased transition-colors duration-300 selection:bg-black selection:text-white dark:bg-black dark:text-zinc-100 dark:selection:bg-white dark:selection:text-black">
      <AppBackdrop />

      {/* Top bar — same anatomy as the site navbar */}
      <header className="relative z-20 border-b border-black/10 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-black/75">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white shadow-sm transition-transform group-hover:scale-105 dark:bg-white dark:text-black">
              <Layers className="h-5 w-5 stroke-[2.5]" />
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

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-65px)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-16">
        {/* ---------- Form ---------- */}
        <div className="fade-up mx-auto w-full max-w-md">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            {isSignUp ? 'Free while in beta' : 'Welcome back'}
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-black dark:text-white sm:text-5xl">
            {isSignUp ? 'Create your workspace' : 'Sign in to Syncro'}
          </h1>
          <p className="mb-8 mt-3 text-base text-zinc-500 dark:text-zinc-400">
            {isSignUp ? 'Tasks, commits and calendars — finally in one place.' : 'Pick up exactly where your team left off.'}
          </p>

          <Bento className="!p-7 shadow-xl">
            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
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

            <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Link to={otherLink} className="font-semibold text-black underline-offset-4 hover:underline dark:text-white">
                {isSignUp ? 'Sign in' : 'Sign up'}
              </Link>
            </p>
          </Bento>
        </div>

        {/* ---------- Showcase (desktop) ---------- */}
        <Bento className="fade-up relative hidden overflow-hidden !p-10 lg:block" style={{ animationDelay: '120ms' }}>
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-black dark:text-white">
            Stop Switching.
            <br />
            <span className="animate-text-shine bg-gradient-to-r from-zinc-500 via-black to-zinc-500 bg-clip-text text-transparent dark:from-zinc-500 dark:via-white dark:to-zinc-500">
              Start Syncing.
            </span>
          </h2>
          <p className="mt-4 max-w-md text-base text-zinc-500 dark:text-zinc-400">
            One real-time workspace for task orchestration, activity streams and team telemetry.
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-3">
            {pillars.map((p) => (
              <li key={p.title} className="rounded-2xl border border-black/[0.07] bg-white p-4 dark:border-white/[0.07] dark:bg-black/50">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black">{p.icon}</div>
                <div className="text-sm font-semibold text-black dark:text-white">{p.title}</div>
                <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{p.text}</div>
              </li>
            ))}
          </ul>
        </Bento>
      </main>
    </div>
  );
};
