import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { WorkspacePage } from './pages/WorkspacePage';
import { useRealtime } from './hooks/useRealtime';
import { WSMessage } from './types';

export const App: React.FC = () => {
  const [eventsCount, setEventsCount] = useState<number>(0);
  const [latestEvent, setLatestEvent] = useState<WSMessage | null>(null);

  const { status } = useRealtime((msg) => {
    setLatestEvent(msg);
    setEventsCount((c) => c + 1);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar connectionStatus={status} eventsCount={eventsCount} />
      <div className="flex-1">
        <WorkspacePage lastMessage={latestEvent} />
      </div>
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        Syncro Connected Workspace • Powered by Express, Prisma, WebSockets & Vite React
      </footer>
    </div>
  );
};

export default App;
