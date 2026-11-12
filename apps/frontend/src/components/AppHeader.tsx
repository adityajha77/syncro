import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Layers, LayoutDashboard, UserRound, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar, ThemeToggle } from './ui';

const pill = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition-all duration-200 ${
    isActive
      ? 'bg-white font-semibold text-black shadow-sm dark:bg-zinc-900 dark:text-white'
      : 'text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white'
  }`;

/**
 * Header for signed-in pages. Same anatomy as the marketing Navbar
 * (logo · pill nav · theme toggle · avatar) so the site and app feel like one product.
 */
export const AppHeader: React.FC<{ left?: React.ReactNode; right?: React.ReactNode }> = ({ left, right }) => {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/80 backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-black/75">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3 lg:flex-none">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5" title="Syncro home">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white shadow-sm transition-transform group-hover:scale-105 dark:bg-white dark:text-black">
              <Layers className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="hidden text-xl font-extrabold tracking-tight text-black dark:text-white xl:inline">Syncro</span>
          </Link>
          {left}
        </div>

        <nav className="hidden shrink-0 items-center gap-1 rounded-2xl border border-black/10 bg-zinc-100 p-1 text-sm font-medium dark:border-white/10 dark:bg-zinc-950 lg:flex">
          <NavLink to="/app" className={pill}>
            <LayoutDashboard className="h-4 w-4" /> Workspace
          </NavLink>
          <NavLink to="/profile" className={pill}>
            <UserRound className="h-4 w-4" /> Profile
          </NavLink>
          <NavLink to="/" end className={pill}>
            <Home className="h-4 w-4" /> Home
          </NavLink>
        </nav>

        <div className="flex shrink-0 items-center gap-2.5">
          {right}
          <ThemeToggle />
          {user && (
            <Link to="/profile" title={`${user.name} — profile`} className="transition-transform hover:scale-105">
              <Avatar name={user.name} size="md" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
