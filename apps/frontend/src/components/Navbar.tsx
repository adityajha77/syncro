import React, { useState } from 'react';
import { Layers, GitBranch, Terminal, Check, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const Navbar: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopyClone = () => {
    navigator.clipboard.writeText('git clone https://github.com/adityajha77/syncro.git');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-extrabold shadow-sm transition-transform hover:scale-105">
            <Layers className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-black dark:text-white tracking-tight">Syncro</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded">
              v0.1
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Clone */}
          <button
            onClick={handleCopyClone}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-100 dark:bg-zinc-950 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/30 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-all active:scale-95"
            title="Click to copy clone command"
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-500" />
            <span>git clone</span>
            {copied ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-sans font-medium text-[11px]">
                <Check className="w-3 h-3" /> Copied!
              </span>
            ) : null}
          </button>

          {/* Status Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-950 border border-black/10 dark:border-white/15 text-zinc-700 dark:text-zinc-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="tracking-tight text-[11px]">Phase 1 Initialized</span>
          </div>

          {/* Theme Toggle Button (Circular Ripple Animation) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/30 text-zinc-700 dark:text-zinc-200 transition-all hover:scale-105 active:scale-90"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-zinc-900 border border-black/10 dark:border-white/10 transition-all"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Repo</span>
          </a>
        </div>
      </div>
    </header>
  );
};
