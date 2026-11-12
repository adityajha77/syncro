import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Layers, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { inputCls } from '../components/ui';

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08090d] text-zinc-100">
      {/* soft glow backdrop */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[780px] -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600/20 via-indigo-500/15 to-sky-500/20 blur-3xl" />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <Link to="/" className="group mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to home
        </Link>

        <div className="fade-up mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-[#13151f] shadow-lg">
          <Layers className="h-8 w-8 text-white" />
        </div>

        <h1 className="mb-1.5 text-center text-3xl font-bold tracking-tight text-white">
          {isSignUp ? 'Create your workspace' : 'Welcome back'}
        </h1>
        <p className="mb-8 text-center text-base text-zinc-400">
          {isSignUp ? 'Tasks, commits and calendars — finally in one place.' : 'Sign in to pick up where your team left off.'}
        </p>

        <div className="fade-up w-full max-w-md rounded-2xl border border-zinc-800/80 bg-[#13151d]/90 p-7 shadow-2xl backdrop-blur">
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-900/40 bg-red-950/40 p-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoComplete="name" className={inputCls} />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? 'At least 8 characters' : 'Your password'}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className={inputCls}
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-60"
            >
              {isSignUp ? 'Create account' : 'Sign in'}
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-400">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <Link to={otherLink} className="font-medium text-white underline-offset-4 hover:underline">
              {isSignUp ? 'Sign in' : 'Sign up'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
