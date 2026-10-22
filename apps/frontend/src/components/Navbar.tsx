import React from 'react';
import { Layers, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type NavTab = 'home' | 'roadmap' | 'pricing' | 'auth';

interface NavbarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onNavigateSection }) => {
  const { isDark, toggleTheme } = useTheme();

  const handleNavClick = (tab: NavTab, sectionId?: string) => {
    if (sectionId && currentTab === 'home' && onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      setCurrentTab(tab);
      if (sectionId && onNavigateSection) {
        setTimeout(() => onNavigateSection(sectionId), 100);
      }
    }
  };

  return (
    <header className="border-b border-black/10 dark:border-white/10 bg-white/85 dark:bg-black/85 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-18 py-3.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div 
          onClick={() => setCurrentTab('home')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-extrabold shadow-sm transition-transform group-hover:scale-105">
            <Layers className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-xl text-black dark:text-white tracking-tight">Syncro</span>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-black/10 dark:border-white/10 text-xs sm:text-sm font-medium">
          <button
            onClick={() => handleNavClick('home')}
            className={`px-3.5 py-2 rounded-xl transition-all duration-200 ${
              currentTab === 'home'
                ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-sm font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => handleNavClick('home', 'features-section')}
            className="px-3.5 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-all duration-200"
          >
            Features
          </button>

          <button
            onClick={() => handleNavClick('home', 'integrations-section')}
            className="px-3.5 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-all duration-200"
          >
            Integrations
          </button>

          <button
            onClick={() => handleNavClick('roadmap')}
            className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
              currentTab === 'roadmap'
                ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-sm font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Roadmap</span>
          </button>

          <button
            onClick={() => handleNavClick('pricing')}
            className={`px-3.5 py-2 rounded-xl transition-all duration-200 ${
              currentTab === 'pricing'
                ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-sm font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Pricing
          </button>
        </nav>

        {/* Right Actions: Theme Toggle, Sign In & Sign Up */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Theme Toggle Button */}
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

          {/* Sign In Button */}
          <button
            onClick={() => setCurrentTab('auth')}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
          >
            Sign In
          </button>

          {/* Sign Up Button */}
          <button
            onClick={() => setCurrentTab('auth')}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            Sign Up
          </button>
        </div>
      </div>
    </header>
  );
};
