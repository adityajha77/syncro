import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore, ApiError } from '../services/api';
import type { User, Workspace } from '../types';

/**
 * Single source of truth for "who is logged in" across every page
 * (marketing site, dashboard, profile). Restores the session from the stored
 * token on load, so refreshing any page keeps you signed in.
 */

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  token: string | null;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspaceId: (id: string) => void;
  /** Insert or replace a workspace in the list (after create/join/update). */
  upsertWorkspace: (ws: Workspace) => void;
  removeWorkspace: (id: string) => void;
  setUser: (u: User) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const ACTIVE_WS_KEY = 'syncro.activeWorkspace';

const readActiveId = () => {
  try {
    return localStorage.getItem(ACTIVE_WS_KEY);
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => tokenStore.get());
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStore.get() ? 'loading' : 'anonymous'));
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(readActiveId);

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    setUser(null);
    setWorkspaces([]);
    setStatus('anonymous');
  }, []);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) return;
    try {
      const me = await api.me();
      setUser(me.user);
      setWorkspaces(me.workspaces);
      setStatus('authenticated');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
      else setStatus((s) => (s === 'loading' ? 'anonymous' : s)); // server down: don't trap on a spinner
    }
  }, [logout]);

  useEffect(() => {
    if (token) void refresh();
  }, [token, refresh]);

  const setActiveWorkspaceId = useCallback((id: string) => {
    setActiveId(id);
    try {
      localStorage.setItem(ACTIVE_WS_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const startSession = useCallback(async (newToken: string) => {
    tokenStore.set(newToken);
    setToken(newToken);
    const me = await api.me();
    setUser(me.user);
    setWorkspaces(me.workspaces);
    setStatus('authenticated');
  }, []);

  const login = useCallback(
    async (email: string, password: string) => startSession((await api.login({ email, password })).token),
    [startSession]
  );
  const signup = useCallback(
    async (name: string, email: string, password: string) =>
      startSession((await api.signup({ name, email, password })).token),
    [startSession]
  );

  const upsertWorkspace = useCallback((ws: Workspace) => {
    setWorkspaces((prev) =>
      prev.some((w) => w.id === ws.id) ? prev.map((w) => (w.id === ws.id ? { ...w, ...ws } : w)) : [...prev, ws]
    );
  }, []);
  const removeWorkspace = useCallback((id: string) => setWorkspaces((prev) => prev.filter((w) => w.id !== id)), []);

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeId) ?? workspaces[0] ?? null,
    [workspaces, activeId]
  );

  const value: AuthContextValue = {
    status,
    user,
    token,
    workspaces,
    activeWorkspace,
    setActiveWorkspaceId,
    upsertWorkspace,
    removeWorkspace,
    setUser,
    login,
    signup,
    logout,
    refresh,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
