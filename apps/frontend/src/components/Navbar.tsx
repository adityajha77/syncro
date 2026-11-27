import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar, ThemeToggle } from './ui';
import { SyncroMark } from './brand';

/** Scrolls to a section on the home page, navigating there first if needed. */
function useSectionNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (sectionId?: string) => {
    const scroll = () => sectionId && document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (pathname !== '/') {
      navigate('/');
      if (sectionId) [80, 200, 400].forEach((ms) => setTimeout(scroll, ms));
    } else if (sectionId) {
      scroll();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
}

const tabCls = (active: boolean) =>
  `rounded-xl px-3.5 py-2 transition-all duration-200 ${
    active ? 'bg-white font-semibold text-black shadow-sm dark:bg-zinc-900 dark:text-white' : 'text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white'
  }`;

/** Marketing header — same anatomy as AppHeader (logo · pill nav · theme · account). */
export const Navbar: React.FC = () => {
  const { status, user } = useAuth();
  const { pathname } = useLocation();
  const goSection = useSectionNav();

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/80 backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-black/75">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
        <Link to="/" className="group flex shrink-0 items-center gap-2.5 justify-self-start" title="Syncro home">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white shadow-sm transition-transform group-hover:scale-105 dark:bg-white dark:text-black">
            <SyncroMark className="h-6 w-6" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-black dark:text-white">Syncro</span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-2xl border border-black/10 bg-zinc-100 p-1 text-sm font-medium dark:border-white/10 dark:bg-zinc-950 md:flex">
          <button onClick={() => goSection('features')} className={tabCls(false)}>
            Features
          </button>
          <button onClick={() => goSection('how')} className={tabCls(false)}>
            How it works
          </button>
          <button onClick={() => goSection('integrations')} className={tabCls(false)}>
            Integrations
          </button>
          <Link to="/pricing" className={tabCls(pathname === '/pricing')}>
            Pricing
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2.5 justify-self-end">
          <ThemeToggle />
          {status === 'loading' ? (
            <div className="h-10 w-28 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
          ) : status === 'authenticated' && user ? (
            <>
              <Link
                to="/app"
                className="hidden items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-zinc-200 sm:inline-flex"
              >
                <LayoutDashboard className="h-4 w-4" /> Open workspace
              </Link>
              <Link to="/profile" title={`${user.name} — profile`} className="transition-transform hover:scale-105">
                <Avatar name={user.name} size="md" />
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-black dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white">
                Sign in
              </Link>
              <Link
                to="/signup"
                className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
