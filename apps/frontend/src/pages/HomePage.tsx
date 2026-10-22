import React, { useState, useRef } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  ArrowUpRight, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { HeroConstellation } from '../components/HeroConstellation';
import { useTheme } from '../context/ThemeContext';

interface HomePageProps {
  onNavigateToRoadmap: () => void;
}

interface ServiceCard {
  id: string;
  tag: string;
  title: string;
  accent: string;
  accentBorder: string;
  accentBg: string;
  description: string;
  features: string[];
}

const COMPANY_SERVICES: ServiceCard[] = [
  {
    id: 'ws-engine',
    tag: '01 // REAL-TIME BUS',
    title: 'Live Workspace Synchronization Engine',
    accent: 'text-emerald-500 dark:text-emerald-400',
    accentBorder: 'border-emerald-500/30',
    accentBg: 'bg-emerald-500/10',
    description: 'Bi-directional WebSocket event architecture propagating state mutations, board edits, and collaborator activities with sub-10ms latency.',
    features: [
      'Zero page refreshes or stale state',
      'Automatic client reconnection & heartbeat',
      'Event bus broadcasting across all peers',
      'Instant task lifecycle updates'
    ],
  },
  {
    id: 'timeline-stream',
    tag: '02 // UNIFIED TIMELINE',
    title: 'Universal Activity Ledger & Event Stream',
    accent: 'text-purple-500 dark:text-purple-400',
    accentBorder: 'border-purple-500/30',
    accentBg: 'bg-purple-500/10',
    description: 'Centralized chronological feed tying commits, task transitions, team comments, and system deployments into a single immutable ledger.',
    features: [
      'Unified cross-tool activity history',
      'Filterable by project, team, and tag',
      'Auditable change log with user attribution',
      'Real-time streaming event delivery'
    ],
  },
  {
    id: 'telemetry-dashboard',
    tag: '03 // HEALTH TELEMETRY',
    title: 'Workspace Health & Operational Telemetry',
    accent: 'text-sky-500 dark:text-sky-400',
    accentBorder: 'border-sky-500/30',
    accentBg: 'bg-sky-500/10',
    description: 'Continuous operational observability monitoring API latencies, PostgreSQL query performance, sprint bottlenecks, and team velocity.',
    features: [
      'Live database query latency metrics',
      'Active socket peer connection counters',
      'Sprint velocity & blocker detection',
      'Comprehensive system health score'
    ],
  },
  {
    id: 'ai-digest',
    tag: '04 // INTELLIGENCE',
    title: 'Autonomous Standup Rollups & Daily Summaries',
    accent: 'text-amber-500 dark:text-amber-400',
    accentBorder: 'border-amber-500/30',
    accentBg: 'bg-amber-500/10',
    description: 'AI-assisted automated synthesis of daily deliverables, surfacing completed work, pending reviews, and critical blockers without meetings.',
    features: [
      'Daily progress digests generated automatically',
      'Surfaces unblocking items for engineering leads',
      'Eliminates repetitive standup sync meetings',
      'Direct integration with task board milestones'
    ],
  },
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigateToRoadmap }) => {
  const { isDark } = useTheme();
  const [copiedCmd, setCopiedCmd] = useState(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText('npm run dev');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const scrollSlider = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const scrollAmount = sliderRef.current.clientWidth * 0.75;
    sliderRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern mask-radial pointer-events-none opacity-40 dark:opacity-60" />

      {/* Hero Section with Antigravity-Style Mouse Constellation Canvas */}
      <section className="relative min-h-[82vh] flex items-center justify-center overflow-hidden px-6 pt-16 pb-24">
        {/* Antigravity Mouse Physics Canvas */}
        <HeroConstellation isDark={isDark} />

        {/* Ambient Top Light Spotlight */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-b from-black/[0.05] dark:from-white/[0.07] to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          {/* Animated Main Headline: Stop Switching. Start Syncing. */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[1.05] select-none">
              <span className="block animate-slide-left text-zinc-900 dark:text-white">
                Stop Switching.
              </span>
              <span className="block animate-slide-right text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-600 to-zinc-900 dark:from-white dark:via-zinc-300 dark:to-zinc-500 animate-text-shine mt-1">
                Start Syncing.
              </span>
            </h1>

            <p className="text-lg sm:text-2xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal pt-2">
              The connected real-time workspace uniting task orchestration, continuous activity streams,
              and workspace telemetry into a single source of truth.
            </p>
          </div>

          {/* Action Buttons: Aceternity-Style Glow & Command Pill */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Command Copy Pill */}
            <div 
              onClick={handleCopy}
              className="group cursor-pointer flex items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/30 transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-95"
              title="Click to copy development command"
            >
              <Terminal className="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
              <span className="font-mono text-sm text-zinc-800 dark:text-zinc-300 font-medium">
                <span className="text-zinc-400 dark:text-zinc-500">$</span> npm run dev
              </span>
              <button type="button" className="ml-1 text-zinc-400 group-hover:text-black dark:group-hover:text-white">
                {copiedCmd ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Aceternity UI-Style Glowing Primary Button */}
            <button
              onClick={onNavigateToRoadmap}
              className="relative group p-0.5 rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 rounded-2xl animate-spin duration-300 opacity-75 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-black dark:bg-zinc-950 text-white font-semibold text-sm transition-transform duration-200 group-hover:scale-[0.99] group-active:scale-95">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>View Phase 1 Architecture & Weekly Sprints</span>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </button>
          </div>

          {/* Antigravity Mouse Hint */}
          <div className="pt-2 text-xs font-mono text-zinc-500 select-none">
            ⚡ MOVE CURSOR OR CLICK IN HERO TO INTERACT WITH REAL-TIME CONSTELLATION
          </div>
        </div>
      </section>

      {/* Before Sync vs With Syncro (Card Fashion) */}
      <section className="py-24 border-y border-black/10 dark:border-white/10 bg-zinc-50/70 dark:bg-zinc-950/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">The Modern Dilemma</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Why Teams Are Fragmented
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
              Compare the friction of juggling disconnected tools against Syncro's unified real-time flow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1: Before Syncro */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-black border border-rose-500/25 shadow-xl relative overflow-hidden group hover:border-rose-500/40 transition-all">
              <div className="flex items-center justify-between mb-6">
                <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  Before Syncro // The Fragmented Stack
                </span>
                <XCircle className="w-6 h-6 text-rose-500" />
              </div>

              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
                Constant Context Switching & Stale Data
              </h3>

              <ul className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold text-base mt-0.5">✕</span>
                  <span>Engineers toggle between 7+ browser tabs to track issues, PRs, chats, and calendars.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold text-base mt-0.5">✕</span>
                  <span>Board updates lag behind reality, requiring endless manual status checkups.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold text-base mt-0.5">✕</span>
                  <span>Sprint bottlenecks remain invisible until sprint reviews, causing missed deadlines.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold text-base mt-0.5">✕</span>
                  <span>Engineers spend 45 minutes daily writing manual standup summaries.</span>
                </li>
              </ul>
            </div>

            {/* Card 2: With Syncro */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-black border border-emerald-500/35 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between mb-6">
                <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  With Syncro // Connected Workspace
                </span>
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>

              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
                Instant State Synchronization & Telemetry
              </h3>

              <ul className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold text-base mt-0.5">✓</span>
                  <span>Single unified interface with bidirectional WebSockets syncing state sub-10ms.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold text-base mt-0.5">✓</span>
                  <span>Universal activity timeline automatically captures commits, task changes, and milestones.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold text-base mt-0.5">✓</span>
                  <span>Continuous workspace health telemetry alerts you to blockers before they stall work.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold text-base mt-0.5">✓</span>
                  <span>Autonomous daily rollups compile developer contributions automatically without meetings.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What We Provide As A Company (Truus-Style Connected Cards Slider with Wires) */}
      <section className="py-28 max-w-7xl mx-auto px-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Product Portfolio</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              What We Provide As A Company
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl">
              Engineered real-time collaboration modules connected through an integrated event wire.
            </p>
          </div>

          {/* Slider Arrow Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollSlider('left')}
              className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/30 text-zinc-700 dark:text-zinc-200 transition-all hover:scale-105 active:scale-95"
              aria-label="Previous card"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollSlider('right')}
              className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/30 text-zinc-700 dark:text-zinc-200 transition-all hover:scale-105 active:scale-95"
              aria-label="Next card"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Truus-Style Interactive Connecting Wire SVG */}
        <div className="relative mb-6 hidden md:block">
          <svg className="w-full h-8 text-black/15 dark:text-white/20" viewBox="0 0 1000 30" fill="none">
            <path
              d="M 10 15 Q 250 -10, 500 15 T 990 15"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              className="animate-pulse"
            />
            {/* Glowing electrical pulse dots */}
            <circle cx="250" cy="8" r="4" className="fill-emerald-400 animate-ping" />
            <circle cx="500" cy="15" r="4" className="fill-purple-400 animate-ping" />
            <circle cx="750" cy="22" r="4" className="fill-sky-400 animate-ping" />
          </svg>
        </div>

        {/* Horizontal Slider Area */}
        <div
          ref={sliderRef}
          className="flex gap-6 overflow-x-auto pb-8 pt-2 scroll-smooth no-scrollbar snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {COMPANY_SERVICES.map((card) => (
            <div
              key={card.id}
              className={`shrink-0 w-[88vw] sm:w-[420px] md:w-[460px] p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border ${card.accentBorder} shadow-xl hover:shadow-2xl transition-all duration-300 snap-start flex flex-col justify-between group hover:-translate-y-1 relative`}
            >
              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-5">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider ${card.accentBg} ${card.accent}`}>
                    {card.tag}
                  </span>
                  <div className="p-2 rounded-xl bg-white dark:bg-black border border-black/10 dark:border-white/10 group-hover:scale-110 transition-transform">
                    <Sparkles className={`w-4 h-4 ${card.accent}`} />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">
                  {card.title}
                </h3>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                  {card.description}
                </p>

                {/* Hand-drawn style card divider line */}
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-black/15 dark:via-white/20 to-transparent my-6" />

                {/* Bullet Features */}
                <ul className="space-y-3 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                  {card.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className={`font-bold ${card.accent} mt-0.5`}>•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Footer Ticker */}
              <div className="mt-8 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-mono text-zinc-500">
                <span>STATUS: ARCHITECTURE DEPLOYED</span>
                <span className={card.accent}>VERIFIED</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mentor Progress Callout Banner */}
      <section className="py-16 max-w-5xl mx-auto px-6">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-zinc-100 dark:to-zinc-950 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>PHASE 1 ARCHITECTURE COMPLETED</span>
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Ready to present to your mentor?
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Explore the dedicated Project Summary page with green verification cards, weekly timeframes,
              and interactive breakdown for Phases 1, 2, 3, and 4.
            </p>
          </div>

          <button
            onClick={onNavigateToRoadmap}
            className="shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            <span>Open Roadmap & Phases</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Monumental Footer with Antigravity-Style Giant Typography: SYNCRO */}
      <footer className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-black pt-16 pb-8 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6">
          {/* Antigravity-Style Giant Display Typography: SYNCRO */}
          <div className="pt-4 pb-4 select-none overflow-hidden text-center">
            <h1 className="text-[17vw] font-black tracking-tighter leading-none text-zinc-900 dark:text-white uppercase transition-colors duration-300">
              Syncro
            </h1>
          </div>

          {/* Sub-Footer Copyright */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-500 border-t border-black/5 dark:border-white/5">
            <p>© 2026 Syncro Connected Workspace. All rights reserved.</p>
            <p className="mt-1 sm:mt-0">Node.js • Express • PostgreSQL • Prisma 7 • WebSockets • React 19</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
