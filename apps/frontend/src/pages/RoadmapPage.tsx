import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  Calendar, 
  ShieldCheck
} from 'lucide-react';

interface TaskDetail {
  id: string;
  name: string;
  desc: string;
  category: 'Backend' | 'Database' | 'Frontend' | 'Realtime' | 'DevOps';
  timeframe: string;
  completed: boolean;
}

interface Phase {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED';
  badge: string;
  timeframe: string;
  percent: number;
  tasks: TaskDetail[];
}

const PHASES: Phase[] = [
  {
    id: 'phase-1',
    number: 'PHASE 01',
    title: 'Architecture & Monorepo Foundation',
    subtitle: 'Codebase setup, Express API, Prisma 7 models, WebSocket gateway, and verification',
    status: 'COMPLETED',
    badge: '100% COMPLETE • VERIFIED & DEPLOYED',
    timeframe: 'Week 1',
    percent: 100,
    tasks: [
      {
        id: 'p1-1',
        name: 'Monorepo Workspaces Layout',
        desc: 'Configured root package.json with npm/pnpm workspaces for apps/frontend and apps/backend.',
        category: 'Backend',
        timeframe: 'Week 1',
        completed: true,
      },
      {
        id: 'p1-2',
        name: 'Express HTTP API & TypeScript Strict Mode',
        desc: 'Initialized Node.js Express server with strict tsconfig, error middleware, and modular routers.',
        category: 'Backend',
        timeframe: 'Week 1',
        completed: true,
      },
      {
        id: 'p1-3',
        name: 'Prisma 7 PostgreSQL Schemas & Adapter',
        desc: 'Defined models for User, Project, Task, Event, ActivityRecord using @prisma/adapter-pg.',
        category: 'Database',
        timeframe: 'Week 1',
        completed: true,
      },
      {
        id: 'p1-4',
        name: 'Real-time WebSocket Gateway',
        desc: 'Attached ws protocol listener to HTTP server for sub-millisecond broadcast synchronization.',
        category: 'Realtime',
        timeframe: 'Week 1',
        completed: true,
      },
      {
        id: 'p1-5',
        name: 'React 19 + TypeScript + Vite Setup',
        desc: 'Tailwind CSS foundation with circular reveal theme engine and Antigravity-style interactive canvas.',
        category: 'Frontend',
        timeframe: 'Week 1',
        completed: true,
      },
      {
        id: 'p1-6',
        name: 'Production Build & Deployment Check',
        desc: 'Compiled both backend and frontend via npm run build with 0 errors and pushed to GitHub.',
        category: 'DevOps',
        timeframe: 'Week 1',
        completed: true,
      },
    ],
  },
  {
    id: 'phase-2',
    number: 'PHASE 02',
    title: 'Collaborative Task Board & Live State',
    subtitle: 'Interactive task board, live database migration, and WebSocket state binding',
    status: 'IN_PROGRESS',
    badge: 'ACTIVE SPRINT • IN PROGRESS',
    timeframe: 'Week 2',
    percent: 40,
    tasks: [
      {
        id: 'p2-1',
        name: 'Real-time Collaborative Task Board UI',
        desc: 'Interactive Kanban board with drag-and-drop task movements propagating across peers.',
        category: 'Frontend',
        timeframe: 'Week 2',
        completed: false,
      },
      {
        id: 'p2-2',
        name: 'Live PostgreSQL Database Migration',
        desc: 'Running prisma migrate dev on PostgreSQL instance with automated seed users and projects.',
        category: 'Database',
        timeframe: 'Week 2',
        completed: false,
      },
      {
        id: 'p2-3',
        name: 'Bidirectional Event Listeners',
        desc: 'Frontend hooks auto-subscribing to TASK_CREATED, TASK_UPDATED, and TASK_COMPLETED.',
        category: 'Realtime',
        timeframe: 'Week 2',
        completed: true,
      },
      {
        id: 'p2-4',
        name: 'Active Collaborator Presence',
        desc: 'Live user avatars and active typing indicators across open workspace documents.',
        category: 'Frontend',
        timeframe: 'Week 2',
        completed: false,
      },
    ],
  },
  {
    id: 'phase-3',
    number: 'PHASE 03',
    title: 'Universal Activity Feed & Telemetry',
    subtitle: 'Centralized activity stream, filter engine, and workspace health diagnostics',
    status: 'PLANNED',
    badge: 'SCHEDULED • UPCOMING',
    timeframe: 'Week 3',
    percent: 0,
    tasks: [
      {
        id: 'p3-1',
        name: 'Unified Activity Timeline Stream',
        desc: 'Chronological activity stream aggregating commits, task mutations, and team milestones.',
        category: 'Frontend',
        timeframe: 'Week 3',
        completed: false,
      },
      {
        id: 'p3-2',
        name: 'Workspace Health Telemetry API',
        desc: 'API metrics tracking query latencies, active socket connections, and memory consumption.',
        category: 'Backend',
        timeframe: 'Week 3',
        completed: false,
      },
      {
        id: 'p3-3',
        name: 'Audit Trail & Event History Ledger',
        desc: 'Persistent PostgreSQL audit trail capturing every state change with user attribution.',
        category: 'Database',
        timeframe: 'Week 3',
        completed: false,
      },
    ],
  },
  {
    id: 'phase-4',
    number: 'PHASE 04',
    title: 'Autonomous Standup Summaries & Cloud Sync',
    subtitle: 'AI daily digest rollups, third-party webhooks, and cloud production release',
    status: 'PLANNED',
    badge: 'SCHEDULED • UPCOMING',
    timeframe: 'Week 4',
    percent: 0,
    tasks: [
      {
        id: 'p4-1',
        name: 'AI Daily Summary Engine',
        desc: 'Automated daily work synthesis unblocking team bottlenecks without daily meetings.',
        category: 'Backend',
        timeframe: 'Week 4',
        completed: false,
      },
      {
        id: 'p4-2',
        name: 'GitHub & Slack Webhook Sync',
        desc: 'Automatic event synchronization when PRs are merged or issues are discussed in Slack.',
        category: 'Realtime',
        timeframe: 'Week 4',
        completed: false,
      },
      {
        id: 'p4-3',
        name: 'Production Multi-Cloud Deployment',
        desc: 'Dockerized multi-container setup with automated CI/CD pipeline on production cluster.',
        category: 'DevOps',
        timeframe: 'Week 4',
        completed: false,
      },
    ],
  },
];

export const RoadmapPage: React.FC = () => {
  // Phase 1 open by default so users see the completed green architecture immediately
  const [openPhases, setOpenPhases] = useState<Record<string, boolean>>({
    'phase-1': true,
    'phase-2': true,
  });

  const togglePhase = (id: string) => {
    setOpenPhases((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern mask-radial pointer-events-none opacity-40 dark:opacity-60" />

      <main className="relative max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-tight bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
            <span>PHASE 1 ARCHITECTURE VERIFIED & DEPLOYED</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Project Summary & Sprints
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            A comprehensive, transparent roadmap showing completed architectural deliverables,
            active sprint implementation, and upcoming project phases.
          </p>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 text-left">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-emerald-500/30">
              <span className="text-[11px] font-mono text-zinc-500 uppercase">Phase 1 Status</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">100% Complete</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Codebase & Arch deployed</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/10 dark:border-white/10">
              <span className="text-[11px] font-mono text-zinc-500 uppercase">Active Sprint</span>
              <p className="text-xl font-bold text-amber-500 mt-1">Phase 2</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Task board & migrations</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/10 dark:border-white/10">
              <span className="text-[11px] font-mono text-zinc-500 uppercase">Total Sprints</span>
              <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">4 Weeks</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Iterative agile releases</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/10 dark:border-white/10">
              <span className="text-[11px] font-mono text-zinc-500 uppercase">Monorepo Packages</span>
              <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">Frontend + API</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Realtime ws + Prisma 7</p>
            </div>
          </div>
        </div>

        {/* Accordion List of Phases */}
        <div className="space-y-6">
          {PHASES.map((phase) => {
            const isOpen = !!openPhases[phase.id];
            const isPhase1 = phase.id === 'phase-1';

            return (
              <div
                key={phase.id}
                className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                  isPhase1
                    ? 'bg-emerald-950/[0.04] dark:bg-emerald-950/15 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                    : phase.status === 'IN_PROGRESS'
                    ? 'bg-zinc-50 dark:bg-zinc-950 border-amber-500/30'
                    : 'bg-zinc-50 dark:bg-zinc-950 border-black/10 dark:border-white/10'
                }`}
              >
                {/* Header (Click to toggle dropdown animation) */}
                <button
                  type="button"
                  onClick={() => togglePhase(phase.id)}
                  className="w-full p-6 sm:p-8 text-left flex items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                          isPhase1
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : phase.status === 'IN_PROGRESS'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-zinc-200 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-black/10 dark:border-white/10'
                        }`}
                      >
                        {phase.number}
                      </span>

                      <span
                        className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-md ${
                          isPhase1
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : phase.status === 'IN_PROGRESS'
                            ? 'bg-amber-500/20 text-amber-500'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {phase.badge}
                      </span>

                      <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {phase.timeframe}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                      {phase.title}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
                      {phase.subtitle}
                    </p>
                  </div>

                  {/* Dropdown Chevron with Smooth Rotation */}
                  <div className="shrink-0 p-2 rounded-xl bg-zinc-200/60 dark:bg-zinc-900 border border-black/10 dark:border-white/10">
                    <ChevronDown
                      className={`w-5 h-5 text-zinc-700 dark:text-zinc-300 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : 'rotate-0'
                      }`}
                    />
                  </div>
                </button>

                {/* Dropdown Content with animated task list */}
                {isOpen && (
                  <div className="px-6 pb-8 sm:px-8 border-t border-black/5 dark:border-white/5 pt-6 animate-fadeIn">
                    <div className="mb-4 flex items-center justify-between text-xs font-mono text-zinc-500">
                      <span>DELIVERABLES & TASKS</span>
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {phase.tasks.filter((t) => t.completed).length} OF {phase.tasks.length} COMPLETED
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {phase.tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            task.completed
                              ? 'bg-emerald-500/[0.03] dark:bg-emerald-500/[0.07] border-emerald-500/30'
                              : 'bg-white dark:bg-black border-black/10 dark:border-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <div className="flex items-center gap-2">
                              {task.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                              )}
                              <h4
                                className={`text-sm font-semibold ${
                                  task.completed
                                    ? 'text-zinc-900 dark:text-white'
                                    : 'text-zinc-700 dark:text-zinc-300'
                                }`}
                              >
                                {task.name}
                              </h4>
                            </div>

                            <span
                              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-semibold shrink-0 ${
                                task.category === 'Backend'
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                  : task.category === 'Database'
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                  : task.category === 'Frontend'
                                  ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20'
                                  : task.category === 'Realtime'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20'
                              }`}
                            >
                              {task.category}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-600 dark:text-zinc-400 pl-6 leading-relaxed">
                            {task.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Antigravity-Style Giant Display Typography: SYNCRO */}
      <footer className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-black pt-16 pb-8 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6">
          <div className="pt-4 pb-4 select-none overflow-hidden text-center">
            <h1 className="text-[17vw] font-black tracking-tighter leading-none text-zinc-900 dark:text-white uppercase transition-colors duration-300">
              Syncro
            </h1>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-500 border-t border-black/5 dark:border-white/5">
            <p>© 2026 Syncro Connected Workspace. All rights reserved.</p>
            <p className="mt-1 sm:mt-0">Node.js • Express • PostgreSQL • Prisma 7 • WebSockets • React 19</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
