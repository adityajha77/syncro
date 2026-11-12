import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layers, Sun, Moon, LayoutDashboard } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui';

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
  `px-3.5 py-2 rounded-xl transition-all duration-200 ${
    active
      ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-sm font-semibold'
      : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
  }`;

export const Navbar: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { status, user } = useAuth();
  const { pathname } = useLocation();
  const goSection = useSectionNav();

  return (
    <header className="border-b border-black/10 dark:border-white/10 bg-white/85 dark:bg-black/85 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 cursor-pointer group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-extrabold shadow-sm transition-transform group-hover:scale-105">
            <Layers className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-xl text-black dark:text-white tracking-tight">Syncro</span>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-black/10 dark:border-white/10 text-sm font-medium">
          <button onClick={() => goSection()} className={tabCls(pathname === '/')}>
            Overview
          </button>
          <button onClick={() => goSection('features-section')} className={tabCls(false)}>
            Features
          </button>
          <button onClick={() => goSection('integrations-section')} className={tabCls(false)}>
            Integrations
          </button>
          <Link to="/roadmap" className={`${tabCls(pathname === '/roadmap')} flex items-center gap-1.5`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Roadmap</span>
          </Link>
          <Link to="/pricing" className={tabCls(pathname === '/pricing')}>
            Pricing
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/30 text-zinc-700 dark:text-zinc-200 transition-all hover:scale-105 active:scale-95"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>

          {status === 'loading' ? (
            <div className="h-9 w-28 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          ) : status === 'authenticated' && user ? (
            <>
              <Link
                to="/app"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                Open Workspace
              </Link>
              <Link to="/profile" title={`${user.name} — profile`} className="transition-transform hover:scale-105">
                <Avatar name={user.name} size="md" />
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all shadow-sm"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
