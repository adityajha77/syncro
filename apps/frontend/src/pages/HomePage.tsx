import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowUpRight, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  GitBranch,
  Calendar,
  Video,
  MessageSquare,
  FileCode2,
  CheckSquare,
  Clock,
  Flame,
  Award
} from 'lucide-react';
import { HeroConstellation } from '../components/HeroConstellation';
import { useTheme } from '../context/ThemeContext';

interface HomePageProps {
  onNavigateToRoadmap: () => void;
  onNavigateToComingSoon: (title?: string) => void;
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

interface IntegrationItem {
  name: string;
  category: string;
  iconBg: string;
  iconText: string;
  icon: React.ReactNode;
}

const INTEGRATIONS: IntegrationItem[] = [
  { name: 'GitHub', category: 'Code & PRs', iconBg: 'bg-zinc-900 text-white', iconText: 'text-white', icon: <GitBranch className="w-5 h-5" /> },
  { name: 'Zoom', category: 'Huddles', iconBg: 'bg-blue-600 text-white', iconText: 'text-blue-500', icon: <Video className="w-5 h-5" /> },
  { name: 'Google Calendar', category: 'Schedules', iconBg: 'bg-blue-500 text-white', iconText: 'text-blue-400', icon: <Calendar className="w-5 h-5" /> },
  { name: 'Google Meet', category: 'Standups', iconBg: 'bg-emerald-600 text-white', iconText: 'text-emerald-500', icon: <Video className="w-5 h-5" /> },
  { name: 'Slack', category: 'Messaging', iconBg: 'bg-purple-600 text-white', iconText: 'text-purple-400', icon: <MessageSquare className="w-5 h-5" /> },
  { name: 'VS Code', category: 'Dev Editor', iconBg: 'bg-sky-600 text-white', iconText: 'text-sky-400', icon: <FileCode2 className="w-5 h-5" /> },
  { name: 'Figma', category: 'Design Sync', iconBg: 'bg-rose-500 text-white', iconText: 'text-rose-400', icon: <Sparkles className="w-5 h-5" /> },
  { name: 'Linear', category: 'Issue Tracker', iconBg: 'bg-indigo-600 text-white', iconText: 'text-indigo-400', icon: <CheckSquare className="w-5 h-5" /> },
  { name: 'Notion', category: 'Documentation', iconBg: 'bg-zinc-800 text-white', iconText: 'text-zinc-300', icon: <Layers className="w-5 h-5" /> },
  { name: 'Discord', category: 'Dev Channels', iconBg: 'bg-indigo-500 text-white', iconText: 'text-indigo-400', icon: <MessageSquare className="w-5 h-5" /> },
];

function Layers(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigateToRoadmap, onNavigateToComingSoon }) => {
  const { isDark } = useTheme();
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [summaryTimeframe, setSummaryTimeframe] = useState<'today' | 'week' | 'sprint'>('today');

  // Auto-scroll animation for cards slider that pauses when hovered
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    let animationId: number;
    const speed = 0.55;

    const autoScroll = () => {
      if (!isHovered && slider) {
        slider.scrollLeft += speed;
        if (slider.scrollLeft >= slider.scrollWidth - slider.clientWidth - 2) {
          slider.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(autoScroll);
    };

    animationId = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(animationId);
  }, [isHovered]);

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
              <span className="block animate-slide-left text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-600 to-zinc-900 dark:from-white dark:via-zinc-300 dark:to-zinc-500 animate-text-shine mt-2">
                Start Syncing.
              </span>
            </h1>

            <p className="text-lg sm:text-2xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal pt-2">
              The connected real-time workspace uniting task orchestration, continuous activity streams,
              and workspace telemetry into a single source of truth.
            </p>
          </div>

          {/* Clean Primary Action Button: "Start Your Journey" (Lands on Coming Soon Page) */}
          <div className="pt-4 flex items-center justify-center">
            <button
              onClick={() => onNavigateToComingSoon('Start Your Journey')}
              className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-base sm:text-lg border border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              <Sparkles className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
              <span>Start Your Journey</span>
              <ArrowUpRight className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
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

      {/* Integrations Section: Animated Marquee Moving from Left to Right with Brand Logos */}
      <section id="integrations-section" className="py-24 border-b border-black/10 dark:border-white/10 overflow-hidden bg-white dark:bg-black">
        <div className="max-w-6xl mx-auto px-6 text-center space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Connected Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Sync With Your Entire Toolchain
          </h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Connect GitHub, Zoom, Google Calendar, Meet, Slack, and your favorite developer utilities in real-time.
          </p>
        </div>

        {/* Infinite Moving Integrations Track (Left to Right) */}
        <div className="relative w-full overflow-hidden py-4">
          <div className="flex gap-4 animate-marquee-right whitespace-nowrap">
            {/* Render items twice for infinite loop */}
            {[...INTEGRATIONS, ...INTEGRATIONS].map((app, idx) => (
              <div
                key={idx}
                className="shrink-0 flex items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 transition-all hover:scale-105 shadow-sm"
              >
                <div className={`w-9 h-9 rounded-xl ${app.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
                  {app.icon}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">{app.name}</p>
                  <p className="text-[11px] font-mono text-zinc-500 leading-tight">{app.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Summary of Your Work Feature Section: "One Stop Place for All the Summary of Your Work" */}
      <section className="py-28 max-w-6xl mx-auto px-6">
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Award className="w-3.5 h-3.5" />
            <span>Workflow Intelligence & Analytics</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            One-Stop Place for All the Summary of Your Work
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Effortlessly visualize your daily accomplishments, code velocity, and focus targets in a single unified dashboard.
          </p>

          {/* Timeframe Selector Pill */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 text-xs font-medium">
              <button
                onClick={() => setSummaryTimeframe('today')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${summaryTimeframe === 'today' ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm font-bold' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}
              >
                Today's Summary
              </button>
              <button
                onClick={() => setSummaryTimeframe('week')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${summaryTimeframe === 'week' ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm font-bold' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}
              >
                This Week
              </button>
              <button
                onClick={() => setSummaryTimeframe('sprint')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${summaryTimeframe === 'sprint' ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm font-bold' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}
              >
                Sprint 1 Cycle
              </button>
            </div>
          </div>
        </div>

        {/* Comprehensive Work Summary Dashboard Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Column 1: Circular Productivity Ring Chart */}
          <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-emerald-500/30 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-500">
                  Focus & Goal Velocity
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  +18% VS LAST SPRINT
                </span>
              </div>

              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">
                Daily Goal Completion
              </h3>

              {/* Circular Ring Chart */}
              <div className="relative w-44 h-44 mx-auto flex items-center justify-center my-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle cx="50" cy="50" r="40" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="10" fill="none" />
                  {/* Progress Arc */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    className="stroke-emerald-500" 
                    strokeWidth="10" 
                    strokeDasharray="251" 
                    strokeDashoffset="35" 
                    strokeLinecap="round" 
                    fill="none" 
                  />
                  {/* Inner Secondary Ring for Reviews */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="28" 
                    className="stroke-purple-500" 
                    strokeWidth="6" 
                    strokeDasharray="175" 
                    strokeDashoffset="35" 
                    strokeLinecap="round" 
                    fill="none" 
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">86%</span>
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Summary Score</span>
                </div>
              </div>

              {/* Legend Breakdown */}
              <div className="grid grid-cols-2 gap-3 pt-6 border-t border-black/5 dark:border-white/5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-zinc-600 dark:text-zinc-400">Core Deliverables (86%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-zinc-600 dark:text-zinc-400">Code Reviews (80%)</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-mono text-zinc-500">
              <span className="flex items-center gap-1.5 text-emerald-500">
                <Flame className="w-3.5 h-3.5" /> 5-day streak
              </span>
              <span>4.6h Deep Work</span>
            </div>
          </div>

          {/* Column 2 & 3: Detailed Work Accomplishment Feed */}
          <div className="lg:col-span-2 p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-black/10 dark:border-white/10 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Automated Rollup</span>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Summary of Your Work</h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5 text-zinc-600 dark:text-zinc-300">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Synthesized at 18:00 • Ready for Standup</span>
                </div>
              </div>

              {/* Highlights List */}
              <div className="space-y-3.5 mb-6">
                <div className="p-4 rounded-2xl bg-white dark:bg-black/60 border border-black/10 dark:border-white/10 flex items-start gap-3.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Architecture & Monorepo Initialized</p>
                      <span className="text-[10px] font-mono text-zinc-500">2h ago</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                      Completed Phase 1 setup with Express API, Prisma 7 PostgreSQL models, and WebSocket event bus.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-black/60 border border-black/10 dark:border-white/10 flex items-start gap-3.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">12 Git Commits Synced & Verified</p>
                      <span className="text-[10px] font-mono text-zinc-500">4h ago</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                      Pushed production-ready codebase to GitHub with strict TypeScript checks passing.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-black/60 border border-black/10 dark:border-white/10 flex items-start gap-3.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Sub-10ms WebSocket Gateway Active</p>
                      <span className="text-[10px] font-mono text-zinc-500">Today</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                      Bidirectional event bus broadcasting TASK_UPDATED and ACTIVITY_RECORDED events live.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Summary Bar */}
            <div className="pt-4 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <span className="text-zinc-500">Zero blockers identified for current sprint</span>
              <button
                onClick={onNavigateToRoadmap}
                className="text-emerald-500 hover:text-emerald-400 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View Full Roadmap Deliverables</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* What We Provide As A Company (Auto-Scrolling Slider with Pause-on-Hover) */}
      <section 
        id="features-section"
        className="py-24 max-w-7xl mx-auto px-6 overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Product Portfolio</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              What We Provide As A Company
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl">
              Engineered real-time collaboration modules connected through an integrated event wire. Hover cursor to pause animation.
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
            <circle cx="250" cy="8" r="4" className="fill-emerald-400 animate-ping" />
            <circle cx="500" cy="15" r="4" className="fill-purple-400 animate-ping" />
            <circle cx="750" cy="22" r="4" className="fill-sky-400 animate-ping" />
          </svg>
        </div>

        {/* Horizontal Slider Area with Auto-Scroll & Pause on Hover */}
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

      {/* Clean Single Line Link to Roadmap */}
      <section className="py-12 text-center">
        <button
          onClick={onNavigateToRoadmap}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/15 hover:border-emerald-500/50 text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white hover:scale-105 active:scale-95 transition-all shadow-sm"
        >
          <span>Open Roadmap and Phases</span>
          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
        </button>
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

          {/* Clickable Built By Aditya Jha and Sinchana */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500 border-t border-black/5 dark:border-white/5">
            <p>© 2026 Syncro Connected Workspace. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-zinc-600 dark:text-zinc-400">Built by</span>
              <a
                href="https://github.com/adityajha77"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/15 hover:border-black/30 dark:hover:border-white/30 text-zinc-900 dark:text-white font-medium hover:scale-105 active:scale-95 transition-all shadow-sm"
              >
                <GitBranch className="w-3.5 h-3.5 text-emerald-500" />
                <span>Aditya Jha</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-400" />
              </a>
              <span className="text-zinc-600 dark:text-zinc-400">and</span>
              <a
                href="https://github.com/Rsinchana16"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/15 hover:border-black/30 dark:hover:border-white/30 text-zinc-900 dark:text-white font-medium hover:scale-105 active:scale-95 transition-all shadow-sm"
              >
                <GitBranch className="w-3.5 h-3.5 text-purple-500" />
                <span>Sinchana</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-400" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
