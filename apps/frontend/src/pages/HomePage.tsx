import React from 'react';
import { CheckCircle2, Cpu, Database, Radio, Sparkles, Terminal } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Connected Workspace • Project Kickoff</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Where engineering teams stay in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">perfect sync</span>.
        </h1>

        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Syncro is a next-generation workspace uniting real-time collaboration, unified activity streams,
          task orchestration, and workspace health telemetry in a single high-performance platform.
        </p>

        {/* Status Callout for Mentor */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Monorepo Architecture Initialized</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>Real-time WebSocket Gateway Active</span>
          </div>
        </div>
      </div>

      {/* Tech Stack Pills */}
      <div className="mt-16 pt-8 border-t border-slate-900 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
        <span className="text-slate-500 font-medium mr-2">Built with:</span>
        <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" /> React 19 + TypeScript + Vite
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-sky-400" /> Node.js + Express
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-blue-400" /> PostgreSQL + Prisma 7 ORM
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-purple-400" /> WebSockets (ws protocol)
        </span>
      </div>

      {/* Core Project Scope & Modules */}
      <div className="mt-20">
        <div className="text-center mb-12">
          <h2 className="text-xl font-bold text-white tracking-tight">Core Modules In Development</h2>
          <p className="text-xs text-slate-400 mt-1">What we are building in the upcoming development sprints</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/30 transition-colors">
            <div className="text-xs font-semibold text-indigo-400 mb-1">01 / REAL-TIME BUS</div>
            <h3 className="text-base font-semibold text-slate-100">Live Workspace Synchronization</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Bi-directional WebSocket bus delivering sub-second state replication across workspace members without page reloads.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/30 transition-colors">
            <div className="text-xs font-semibold text-purple-400 mb-1">02 / TIMELINE</div>
            <h3 className="text-base font-semibold text-slate-100">Unified Activity Stream</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Consolidated chronological event log tracking commits, task lifecycle changes, project updates, and team milestones.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/30 transition-colors">
            <div className="text-xs font-semibold text-sky-400 mb-1">03 / TELEMETRY</div>
            <h3 className="text-base font-semibold text-slate-100">Workspace Health Dashboard</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Actionable insights on team velocity, delivery bottlenecks, system uptime, and project operational metrics.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/30 transition-colors">
            <div className="text-xs font-semibold text-amber-400 mb-1">04 / INTELLIGENCE</div>
            <h3 className="text-base font-semibold text-slate-100">Daily Work Summaries</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Automated daily progress rollups, standup digests, and priority focus tracking for productive team synchronization.
            </p>
          </div>
        </div>
      </div>

      {/* Mentor Review Note Box */}
      <div className="mt-16 p-6 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 text-center space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Status Report</p>
        <p className="text-sm text-slate-200">
          The monorepo structure, database schemas, Express API endpoints, and real-time WebSocket protocol are in place.
        </p>
        <p className="text-xs text-slate-400">
          Ready to begin sprint implementation of the frontend UI and business workflows.
        </p>
      </div>
    </div>
  );
};
