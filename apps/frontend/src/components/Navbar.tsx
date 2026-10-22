import React from 'react';
import { Layers, GitBranch, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  currentTab: 'home' | 'roadmap';
  setCurrentTab: (tab: 'home' | 'roadmap') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="border-b border-black/10 dark:border-white/10 bg-white/85 dark:bg-black/85 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 h-18 py-3.5 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => setCurrentTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-extrabold shadow-sm transition-transform group-hover:scale-105">
            <Layers className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-xl text-black dark:text-white tracking-tight">Syncro</span>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-black/10 dark:border-white/10 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setCurrentTab('home')}
            className={`px-4 py-2 rounded-xl transition-all duration-200 ${
              currentTab === 'home'
                ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-sm font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setCurrentTab('roadmap')}
            className={`px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
              currentTab === 'roadmap'
                ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-sm font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Project Roadmap</span>
          </button>
        </nav>

        {/* Right Actions: Theme Toggle & GitHub */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button (Expanding Circular Reveal) */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/30 text-zinc-700 dark:text-zinc-200 transition-all hover:scale-105 active:scale-95"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700 transition-transform -rotate-12 hover:rotate-0" />
            )}
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com/adityajha77/syncro"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-zinc-900 border border-black/10 dark:border-white/10 transition-all"
          >
            <GitBranch className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};
