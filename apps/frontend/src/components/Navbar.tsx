import React from 'react';
import { Layers, GitBranch } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">Syncro</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Phase 1: Architecture Initialized
          </span>
          <a
            href="https://github.com/adityajha77/syncro"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
            title="GitHub Repository"
          >
            <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};
