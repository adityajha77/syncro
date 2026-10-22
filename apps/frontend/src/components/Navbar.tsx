import React from 'react';
import { Layers, Radio, Globe } from 'lucide-react';
import { ConnectionStatus } from '../hooks/useRealtime';

interface NavbarProps {
  connectionStatus: ConnectionStatus;
  eventsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ connectionStatus, eventsCount }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">Syncro</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Workspace
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Connected Real-time Collaboration Engine</p>
          </div>
        </div>

        {/* Center / Workspace Selector */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span>Workspace:</span>
          <span className="font-semibold text-white">Core Engineering Hub</span>
        </div>

        {/* Right side connection badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse'
                    : connectionStatus === 'connecting'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-[11px] font-medium text-slate-300 uppercase tracking-wide">
                {connectionStatus === 'connected'
                  ? 'Real-time Live'
                  : connectionStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Offline'}
              </span>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-xs text-indigo-300 font-medium">
            ⚡ {eventsCount} events
          </div>
        </div>
      </div>
    </header>
  );
};
