import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Themes: light, dark, and three soft tinted light themes so each person can
 * make their workspace feel like theirs. Tinted themes recolor the surfaces
 * through CSS (see "Tinted themes" in index.css); everything else stays the same.
 */
export type ThemeId = 'light' | 'dark' | 'blush' | 'sky' | 'lavender';

export const THEMES: { id: ThemeId; label: string; swatch: string; ring: string }[] = [
  { id: 'light', label: 'Light', swatch: '#ffffff', ring: '#d4d4d8' },
  { id: 'dark', label: 'Dark', swatch: '#09090b', ring: '#3f3f46' },
  { id: 'blush', label: 'Blush', swatch: '#fbcfe8', ring: '#f472b6' },
  { id: 'sky', label: 'Sky', swatch: '#bfdbfe', ring: '#60a5fa' },
  { id: 'lavender', label: 'Lavender', swatch: '#ddd6fe', ring: '#a78bfa' },
];

const STORAGE_KEY = 'syncro-theme';
const isThemeId = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v);

/** Same logic as the inline script in index.html (runs before first paint). */
export const applyThemeClasses = (theme: ThemeId) => {
  const root = document.documentElement;
  root.classList.remove('dark', 'light', 'tinted', ...THEMES.map((t) => `theme-${t.id}`));
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.add('light');
  if (theme !== 'light' && theme !== 'dark') root.classList.add('tinted', `theme-${theme}`);
};

interface ThemeContextType {
  theme: ThemeId;
  isDark: boolean;
  /** Switches theme with a circular reveal from the clicked element. */
  setTheme: (theme: ThemeId, origin?: { x: number; y: number }) => void;
  toggleTheme: (e: React.MouseEvent<HTMLElement>) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'dark', isDark: true, setTheme: () => {}, toggleTheme: () => {} });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isThemeId(stored)) return stored;
    } catch {
      /* storage unavailable */
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    applyThemeClasses(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = (next: ThemeId, origin?: { x: number; y: number }) => {
    if (next === theme) return;
    const doc = document as unknown as { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduced) return setThemeState(next);
    const x = origin?.x ?? window.innerWidth - 40;
    const y = origin?.y ?? 30;
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const transition = doc.startViewTransition(() => {
      applyThemeClasses(next); // apply synchronously so the snapshot has the new colors
      setThemeState(next);
    });
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
        { duration: 600, easing: 'cubic-bezier(0.2, 0, 0, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
  };

  const toggleTheme = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTheme(theme === 'dark' ? 'light' : 'dark', { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  return <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
