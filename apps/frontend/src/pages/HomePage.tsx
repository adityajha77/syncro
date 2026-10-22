import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Radio, 
  ArrowUpRight, 
  Zap,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { HeroConstellation } from '../components/HeroConstellation';
import { useTheme } from '../context/ThemeContext';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  category: 'Backend' | 'Database' | 'Frontend' | 'Realtime';
  status: 'DONE' | 'IN_PROGRESS' | 'PLANNED';
}

const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    id: 'r-1',
    title: 'Workspaces Layout & Monorepo DX',
    description: 'Configured npm/pnpm workspaces for apps/frontend and apps/backend with root orchestration.',
    category: 'Backend',
    status: 'DONE',
  },
  {
    id: 'r-2',
    title: 'Express HTTP API & TypeScript Strict Mode',
    description: 'Node.js Express server configured with /api/v1/health, /api/v1/tasks, /api/v1/activities.',
    category: 'Backend',
    status: 'DONE',
  },
  {
    id: 'r-3',
    title: 'Prisma 7 Schema Models & Driver Adapter',
    description: 'PostgreSQL schema with User, Project, Task, Event, ActivityRecord and @prisma/adapter-pg.',
    category: 'Database',
    status: 'DONE',
  },
  {
    id: 'r-4',
    title: 'Real-time WebSocket Gateway',
    description: 'Live bidirectional ws protocol server attached to Express for sub-millisecond event broadcasts.',
    category: 'Realtime',
    status: 'DONE',
  },
  {
    id: 'r-5',
    title: 'React 19 + TypeScript + Vite Foundation',
    category: 'Frontend',
    description: 'Tailwind CSS setup with circular theme reveal, responsive layouts, and interactive canvas.',
    status: 'DONE',
  },
  {
    id: 'r-6',
    title: 'Collaborative Task Board & Live Kanban UI',
    description: 'Interactive drag-and-drop board updating state across active team members simultaneously.',
    category: 'Frontend',
    status: 'IN_PROGRESS',
  },
  {
    id: 'r-7',
    title: 'PostgreSQL Live Migration & Seed Database',
    description: 'Executing prisma migrate dev on production PostgreSQL instance and populating initial seed users.',
    category: 'Database',
    status: 'IN_PROGRESS',
  },
  {
    id: 'r-8',
    title: 'Universal Activity Feed & Filtering',
    description: 'Real-time streaming ledger aggregating commits, task status transitions, and team milestones.',
    category: 'Realtime',
    status: 'PLANNED',
  },
  {
    id: 'r-9',
    title: 'AI Daily Summary & Standup Digest Engine',
    description: 'Automated synthesis of daily contributions, blocker detection, and team focus targets.',
    category: 'Backend',
    status: 'PLANNED',
  },
];

export const HomePage: React.FC = () => {
  const { isDark } = useTheme();
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DONE' | 'WORK_LEFT'>('ALL');
  const [mousePulse, setMousePulse] = useState(1);

  const handleCopy = () => {
    navigator.clipboard.writeText('npm run dev');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const doneCount = ROADMAP_ITEMS.filter((i) => i.status === 'DONE').length;
  const totalCount = ROADMAP_ITEMS.length;
  const progressPercent = Math.round((doneCount / totalCount) * 100);

  const filteredItems = ROADMAP_ITEMS.filter((item) => {
    if (activeFilter === 'DONE') return item.status === 'DONE';
    if (activeFilter === 'WORK_LEFT') return item.status !== 'DONE';
    return true;
  });

  return (
    <div className="relative min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Background Subtle Grid */}
      <div className="absolute inset-0 bg-grid-pattern mask-radial pointer-events-none opacity-40 dark:opacity-60" />

      {/* Hero Section with Interactive Antigravity Mouse Physics */}
      <section className="relative min-h-[82vh] flex items-center justify-center overflow-hidden px-6 pt-12 pb-20">
        {/* Antigravity-style Interactive Mouse Constellation Canvas */}
        <HeroConstellation isDark={isDark} />

        {/* Ambient Radial Spotlight */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-b from-black/[0.04] dark:from-white/[0.08] to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-tight bg-zinc-100 dark:bg-zinc-950 border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-400 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>CONNECTED WORKSPACE</span>
            <span className="text-zinc-400 dark:text-zinc-600">/</span>
            <span className="text-zinc-900 dark:text-zinc-200 font-medium">PHASE 1 ACTIVE</span>
          </div>

          {/* Antigravity-Style Hero Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] select-none">
            <span className="block text-zinc-500 dark:text-zinc-400 text-xl sm:text-2xl font-medium tracking-normal mb-2">
              Syncro Platform
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-500 dark:from-white dark:via-zinc-100 dark:to-zinc-500">
              Where engineering teams stay in perfect sync.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
            A real-time workspace unifying task orchestration, continuous activity streams,
            and system telemetry — built with Node.js, Prisma 7, WebSockets, and React 19.
          </p>

          {/* Interactive Mouse Hint & Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <div 
              onClick={handleCopy}
              className="group cursor-pointer flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/30 transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-95"
              title="Click to copy development command"
            >
              <Terminal className="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
              <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                <span className="text-zinc-400 dark:text-zinc-500">$</span> npm run dev
              </span>
              <button type="button" className="ml-1 text-zinc-400 group-hover:text-black dark:group-hover:text-white">
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              onClick={() => {
                setMousePulse((p) => p + 1);
                const el = document.getElementById('company-offerings');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Explore Platform Capabilities</span>
            </button>
          </div>

          {/* Interactive Hero Canvas Hint */}
          <div className="pt-4 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 select-none">
            ⚡ MOVE CURSOR OR CLICK IN HERO TO TRIGGER GRAVITY SYNC #{mousePulse}
          </div>
        </div>
      </section>

      {/* High-Impact Animated Section: Stop Switching. Start Syncing. */}
      <section className="py-24 border-y border-black/10 dark:border-white/10 bg-zinc-50/60 dark:bg-zinc-950/40 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-500 dark:text-zinc-400 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Core Problem & Solution</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight select-none">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-600 to-zinc-900 dark:from-white dark:via-zinc-400 dark:to-white animate-text-shine">
              Stop Switching. Start Syncing.
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Engineering teams lose 30% of their momentum context-switching between fragmented chats,
            stale Kanban boards, disconnected Git repos, and disparate status summaries. Syncro unifies them
            into one live connected workspace.
          </p>

          {/* Comparison Cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="p-6 rounded-2xl bg-white dark:bg-black border border-rose-500/20 shadow-sm relative">
              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-3 font-semibold">
                BEFORE SYNCRO (FRAGMENTED)
              </span>
              <ul className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Constant context switching across 5+ disconnected browser tabs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Stale task statuses requiring manual reminder pings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Lost sprint velocity with invisible dependencies and blockers</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-black border border-emerald-500/25 shadow-sm relative">
              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3 font-semibold">
                WITH SYNCRO (CONNECTED)
              </span>
              <ul className="space-y-3 text-xs text-zinc-700 dark:text-zinc-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Unified workspace with sub-millisecond WebSocket state updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Continuous live activity stream linking tasks, commits, and milestones</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Automated daily work summaries and workspace health telemetry</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What Things We Provide As A Company */}
      <section id="company-offerings" className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center space-y-3 mb-16">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">Platform Capabilities</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            What We Provide As A Company
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Syncro delivers four foundational real-time products engineered to keep high-velocity teams in sync.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 */}
          <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
              <Radio className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1">01 // REAL-TIME ENGINE</div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Live Workspace Synchronization Bus</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Bi-directional WebSocket infrastructure propagating state changes, drag-and-drop task movements,
              and collaborative edits to every connected peer with sub-10ms latency and no page refreshes.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1">02 // UNIFIED TIMELINE</div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Centralized Activity Stream & Ledger</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Consolidated chronological event log that captures project commits, task creations, status updates,
              and team announcements into a single searchable, filterable timeline feed.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1">03 // TELEMETRY</div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Workspace Health & Sprint Telemetry</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Live operational dashboard monitoring database query latencies, active socket connections,
              sprint velocity, and delivery bottlenecks to maintain workspace reliability.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1">04 // AUTOMATION</div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Daily Standup Rollups & Work Summaries</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Intelligent digests that summarize daily team progress, highlights completed deliverables,
              and identifies critical path blockers without requiring manual status update meetings.
            </p>
          </div>
        </div>
      </section>

      {/* Progress & Work Left Tracker (Sprint Report for Mentor) */}
      <section className="py-20 border-t border-black/10 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-950/30">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Project Execution</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
                Project Summary & Work Remaining
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Detailed sprint status report of completed architectural foundations and upcoming deliverables.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-900 border border-black/10 dark:border-white/10 text-xs">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeFilter === 'ALL'
                    ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                All ({ROADMAP_ITEMS.length})
              </button>
              <button
                onClick={() => setActiveFilter('DONE')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeFilter === 'DONE'
                    ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Completed ({doneCount})
              </button>
              <button
                onClick={() => setActiveFilter('WORK_LEFT')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeFilter === 'WORK_LEFT'
                    ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Work Left ({totalCount - doneCount})
              </button>
            </div>
          </div>

          {/* Progress Bar Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-black border border-black/10 dark:border-white/10 shadow-sm mb-6">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-zinc-600 dark:text-zinc-400">PHASE 1 ARCHITECTURE STATUS</span>
              <span className="font-bold text-zinc-900 dark:text-white">{progressPercent}% COMPLETE</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-black dark:bg-white rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>{doneCount} foundational tasks verified & pushed</span>
              <span>{totalCount - doneCount} active features scheduled</span>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-white dark:bg-black border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.status === 'DONE' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : item.status === 'IN_PROGRESS' ? (
                      <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-zinc-400 dark:border-zinc-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">{item.title}</h4>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-black/5 dark:border-white/5">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{item.description}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                      item.status === 'DONE'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : item.status === 'IN_PROGRESS'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-black/10 dark:border-white/10'
                    }`}
                  >
                    {item.status === 'DONE' ? 'DONE' : item.status === 'IN_PROGRESS' ? 'IN PROGRESS' : 'WORK LEFT'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monumental Footer with Antigravity-Style Massive "Syncro" Display */}
      <footer className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-black pt-16 pb-8 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6">
          {/* Footer Navigation Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pb-16 border-b border-black/10 dark:border-white/10 text-xs">
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 font-mono">
                Product
              </p>
              <ul className="space-y-2.5 text-zinc-600 dark:text-zinc-400">
                <li className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">Workspace Engine</li>
                <li className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">Real-time Bus</li>
                <li className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">Activity Timeline</li>
                <li className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">Health Telemetry</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 font-mono">
                Architecture
              </p>
              <ul className="space-y-2.5 text-zinc-600 dark:text-zinc-400">
                <li className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">Monorepo Layout</li>
                <li className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">Express Gateway</li>
                <li className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">Prisma 7 Models</li>
                <li className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">WebSocket Protocol</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 font-mono">
                Developers
              </p>
              <ul className="space-y-2.5 text-zinc-600 dark:text-zinc-400">
                <li>
                  <a href="https://github.com/adityajha77/syncro" target="_blank" rel="noreferrer" className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
                    <span>GitHub Repository</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </li>
                <li className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">API Reference</li>
                <li className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">Prisma Studio</li>
                <li className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">Documentation</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 font-mono">
                Status
              </p>
              <ul className="space-y-2.5 text-zinc-600 dark:text-zinc-400">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Phase 1 Initialized</span>
                </li>
                <li className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">Roadmap (65% Done)</li>
                <li className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">Changelog</li>
                <li className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">Releases</li>
              </ul>
            </div>
          </div>

          {/* Antigravity-Style Giant Display Typography: SYNCRO */}
          <div className="pt-8 pb-4 select-none overflow-hidden text-center">
            <h1 className="text-[17vw] font-black tracking-tighter leading-none text-zinc-900 dark:text-white uppercase transition-colors duration-300">
              Syncro
            </h1>
          </div>

          {/* Sub-Footer Copyright */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-zinc-500 border-t border-black/5 dark:border-white/5">
            <p>© 2026 Syncro Connected Workspace. All rights reserved.</p>
            <p className="mt-1 sm:mt-0">Production Monorepo • Node.js + Prisma 7 + WebSockets + React 19</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
