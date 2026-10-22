import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Radio, 
  Database, 
  Cpu, 
  ArrowUpRight, 
  Zap,
  Clock
} from 'lucide-react';

interface ModuleTab {
  id: string;
  tag: string;
  title: string;
  desc: string;
  previewType: 'ws' | 'timeline' | 'health' | 'summary';
}

const MODULES: ModuleTab[] = [
  {
    id: 'realtime',
    tag: 'MODULE // 01',
    title: 'Real-Time Sync Bus',
    desc: 'Sub-millisecond WebSocket event pipeline replicating state mutations across all active team members simultaneously.',
    previewType: 'ws',
  },
  {
    id: 'timeline',
    tag: 'MODULE // 02',
    title: 'Unified Activity Stream',
    desc: 'Aggregates task lifecycle changes, code reviews, and event scheduling into a single chronological timeline.',
    previewType: 'timeline',
  },
  {
    id: 'health',
    tag: 'MODULE // 03',
    title: 'Workspace Health Telemetry',
    desc: 'Continuous real-time telemetry tracking sprint throughput, database query latencies, and service vitals.',
    previewType: 'health',
  },
  {
    id: 'summary',
    tag: 'MODULE // 04',
    title: 'Daily Work Summaries',
    desc: 'Automated workflow intelligence rolling up daily contributions, unblocking bottlenecks, and tracking focus targets.',
    previewType: 'summary',
  },
];

export const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ModuleTab>(MODULES[0]);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [pingCount, setPingCount] = useState(1);
  const [isPinging, setIsPinging] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('npm run dev');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleTriggerPing = () => {
    setIsPinging(true);
    setTimeout(() => {
      setPingCount((c) => c + 1);
      setIsPinging(false);
    }, 400);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-black text-zinc-100">
      {/* Background Subtle Grid & Radial Ambient Fade */}
      <div className="absolute inset-0 bg-grid-white mask-radial pointer-events-none opacity-60" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-white/[0.07] to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-28">
        {/* Top Minimal Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-tight bg-zinc-950 border border-white/10 hover:border-white/20 transition-all shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-zinc-400">PROJECT KICKOFF</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-200">CONNECTED WORKSPACE</span>
          </div>
        </div>

        {/* Hero Headline with B&W Fade */}
        <div className="text-center mt-8 space-y-6 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] select-none">
            <span className="block text-zinc-400 text-2xl sm:text-3xl font-medium tracking-normal mb-2">
              Syncro Platform
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-500">
              Where engineering teams stay in perfect sync.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
            A high-performance connected workspace architecture unifying task orchestration,
            instantaneous WebSocket replication, and team telemetry.
          </p>

          {/* Quickstart Command Bar (Interactive Click-to-Copy) */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <div 
              onClick={handleCopy}
              className="group cursor-pointer flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-950 border border-white/10 hover:border-white/30 transition-all duration-200 shadow-lg shadow-black/60 hover:shadow-white/[0.03]"
              title="Click to copy development command"
            >
              <Terminal className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
              <span className="font-mono text-xs text-zinc-300">
                <span className="text-zinc-500">$</span> npm run dev
              </span>
              <button 
                type="button"
                className="ml-2 text-zinc-500 group-hover:text-zinc-300 transition-colors"
              >
                {copiedCmd ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Interactive Pulse Test Button */}
            <button
              onClick={handleTriggerPing}
              disabled={isPinging}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95 disabled:opacity-75"
            >
              <Zap className={`w-3.5 h-3.5 fill-black ${isPinging ? 'animate-bounce' : ''}`} />
              <span>{isPinging ? 'Broadcasting...' : `Simulate Event Bus (#${pingCount})`}</span>
            </button>
          </div>
        </div>

        {/* Tech Foundation Banner */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-zinc-500">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-zinc-300" /> React 19 + TypeScript
          </span>
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-zinc-300" /> Express + Node
          </span>
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-zinc-300" /> PostgreSQL + Prisma 7
          </span>
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-zinc-300" /> WebSockets (ws)
          </span>
        </div>

        {/* Interactive Architecture Explorer (Clickable Modules) */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Architecture Scope</p>
              <h2 className="text-xl font-bold text-white tracking-tight">Core System Modules</h2>
            </div>
            <div className="text-xs font-mono text-zinc-500 hidden sm:block">
              CLICK TABS TO EXPLORE
            </div>
          </div>

          {/* Module Selector Tabs (Interactive Click) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {MODULES.map((mod) => {
              const isSelected = activeTab.id === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveTab(mod)}
                  className={`text-left p-3.5 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                    isSelected
                      ? 'bg-zinc-900 border-white/30 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                      : 'bg-zinc-950/60 border-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/15'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-white" />
                  )}
                  <span className="block font-mono text-[10px] text-zinc-500 mb-1">{mod.tag}</span>
                  <span className="block text-xs font-semibold truncate">{mod.title}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Preview Canvas */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl relative overflow-hidden transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-white/5">
              <div>
                <span className="text-xs font-mono text-zinc-500">{activeTab.tag}</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{activeTab.title}</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">{activeTab.desc}</p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-zinc-900 text-zinc-300 border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  STATUS: LIVE
                </span>
              </div>
            </div>

            {/* Dynamic Interactive Preview Viewports */}
            {activeTab.previewType === 'ws' && (
              <div className="p-4 rounded-xl bg-black border border-white/5 font-mono text-xs space-y-2 text-zinc-300">
                <div className="flex items-center justify-between text-zinc-500 text-[11px] border-b border-white/5 pb-2 mb-2">
                  <span>WEBSOCKET GATEWAY // PORT 5000</span>
                  <span className="text-white">EVENT BUS READY</span>
                </div>
                <p className="text-zinc-400">[00:00:01] <span className="text-zinc-200 font-semibold">&gt; CONNECT</span> Client connected to /ws endpoint</p>
                <p className="text-zinc-400">[00:00:02] <span className="text-zinc-200 font-semibold">&gt; BROADCAST</span> TASK_UPDATED :: Payload synced to active sockets</p>
                <p className="text-white font-medium">[00:00:03] <span className="text-zinc-400">&gt; TELEMETRY</span> Event latency: 1.4ms • Round-trip confirmed</p>
              </div>
            )}

            {activeTab.previewType === 'timeline' && (
              <div className="p-4 rounded-xl bg-black border border-white/5 font-mono text-xs space-y-2.5 text-zinc-300">
                <div className="flex items-center justify-between text-zinc-500 text-[11px] border-b border-white/5 pb-2 mb-2">
                  <span>UNIFIED FEED // AGGREGATOR</span>
                  <span className="text-white">STREAM ACTIVE</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-zinc-500">12:00 PM</span>
                  <span className="text-white font-semibold">Repository Initialized</span>
                  <span className="text-zinc-500">• Monorepo configuration confirmed</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-zinc-500">12:02 PM</span>
                  <span className="text-white font-semibold">Prisma 7 Schemas</span>
                  <span className="text-zinc-500">• PostgreSQL models compiled</span>
                </div>
              </div>
            )}

            {activeTab.previewType === 'health' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-black border border-white/5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">API Node</span>
                  <p className="text-base font-bold text-white mt-1">Operational</p>
                  <p className="text-[11px] font-mono text-zinc-400 mt-0.5">Uptime: 99.98%</p>
                </div>
                <div className="p-3 rounded-xl bg-black border border-white/5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">PostgreSQL</span>
                  <p className="text-base font-bold text-white mt-1">Prisma 7 Engine</p>
                  <p className="text-[11px] font-mono text-zinc-400 mt-0.5">Driver Adapter Active</p>
                </div>
                <div className="p-3 rounded-xl bg-black border border-white/5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">WebSocket Bus</span>
                  <p className="text-base font-bold text-white mt-1">ws://localhost:5000</p>
                  <p className="text-[11px] font-mono text-zinc-400 mt-0.5">&lt; 2ms latency</p>
                </div>
              </div>
            )}

            {activeTab.previewType === 'summary' && (
              <div className="p-4 rounded-xl bg-black border border-white/5 text-xs text-zinc-300 space-y-2">
                <div className="flex items-center justify-between text-zinc-500 text-[11px] font-mono border-b border-white/5 pb-2 mb-2">
                  <span>DAILY DIGEST // SPRINT 1</span>
                  <span className="text-white font-semibold">100% INITIALIZATION</span>
                </div>
                <p className="text-zinc-300">
                  <span className="text-white font-semibold">Completed:</span> Root workspaces layout, Express HTTP routing, Prisma schema models, and WebSocket server setup.
                </p>
                <p className="text-zinc-400">
                  <span className="text-zinc-200 font-semibold">Next Sprint:</span> Real-time collaborative workspace interface and database migration execution.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mentor Report Note Box */}
        <div className="mt-16 p-6 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase text-zinc-400 font-semibold tracking-wide">
                MENTOR PROGRESS REPORT
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <p className="text-xs text-zinc-300">
              The foundational monorepo, schema design, and server infrastructure have been stood up cleanly.
            </p>
          </div>
          <a
            href="https://github.com/adityajha77/syncro"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold border border-white/10 hover:border-white/25 transition-all"
          >
            <span>View GitHub Codebase</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
