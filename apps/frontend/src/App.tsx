import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppBackdrop, ToastProvider, useToast } from './components/ui';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { PricingPage } from './pages/PricingPage';
import { AuthPage } from './pages/AuthPage';
import { WorkspaceApp } from './pages/WorkspaceApp';
import { ProfilePage } from './pages/ProfilePage';
import { api } from './services/api';

/**
 * Routes
 *   /            /pricing                   marketing site (Navbar knows if you're signed in)
 *   /login       /signup                    auth (redirects to ?next= or /app when done)
 *   /app                                    workspace dashboard        (signed in)
 *   /profile                                profile & integrations     (signed in)
 *   /join/:code                             accept an invite link      (signed in)
 */

const FullPageSpinner: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center gap-2 bg-white text-sm text-zinc-500 dark:bg-black dark:text-zinc-400">
    <Loader2 className="h-5 w-5 animate-spin" />
    Loading…
  </div>
);

/** Every page (and every workspace view) opens at the top — including after a reload. */
const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();
  const view = new URLSearchParams(search).get('view'); // opening a card (?task=) must not jump
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, view]);
  return null;
};

/** Gate for signed-in pages; remembers where you were going. */
const RequireAuth: React.FC = () => {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'anonymous') {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  return <Outlet />;
};

/** Same surface as the app (backdrop grid + cursor spotlight) so the site and product feel like one thing. */
const MarketingLayout: React.FC = () => (
  <div className="hand-site relative flex min-h-screen flex-col bg-white text-zinc-900 antialiased transition-colors duration-300 selection:bg-black selection:text-white dark:bg-black dark:text-zinc-100 dark:selection:bg-white dark:selection:text-black">
    <AppBackdrop />
    <Navbar />
    <main className="relative z-10 flex-1">
      <Outlet />
    </main>
  </div>
);

/** /join/:code — joins the workspace and opens it. */
const JoinRoute: React.FC = () => {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { upsertWorkspace, setActiveWorkspaceId } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // StrictMode double-invoke guard
    started.current = true;
    api
      .joinWorkspace(code)
      .then((ws) => {
        upsertWorkspace(ws);
        setActiveWorkspaceId(ws.id);
        toast('success', `You're in! Welcome to ${ws.name}.`);
        navigate('/app', { replace: true });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not join'));
  }, [code, navigate, toast, upsertWorkspace, setActiveWorkspaceId]);

  if (!error) return <FullPageSpinner />;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center text-zinc-800 dark:bg-black dark:text-zinc-200">
      <p className="text-lg font-semibold">Couldn't join that workspace</p>
      <p className="text-sm text-zinc-400">{error}</p>
      <button
        onClick={() => navigate('/app')}
        className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black"
      >
        Go to my workspace
      </button>
    </div>
  );
};

export const App: React.FC = () => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <ScrollToTop />
          <Routes>
            <Route element={<MarketingLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/pricing" element={<PricingPage />} />
            </Route>

            <Route path="/login" element={<AuthPage mode="SIGN_IN" />} />
            <Route path="/signup" element={<AuthPage mode="SIGN_UP" />} />

            <Route element={<RequireAuth />}>
              <Route path="/app" element={<WorkspaceApp />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/join/:code" element={<JoinRoute />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;

