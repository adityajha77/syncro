import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUpRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  GitBranch,
  Calendar,
  Video,
  MessageSquare,
  FileCode2,
  CheckSquare,
  Clock,
  Flame,
  Award,
  Layers
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
    accentBorder: 'border-emerald-500/30 group-hover:border-emerald-500/60',
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
    accentBorder: 'border-purple-500/30 group-hover:border-purple-500/60',
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
    accentBorder: 'border-sky-500/30 group-hover:border-sky-500/60',
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
    accentBorder: 'border-amber-500/30 group-hover:border-amber-500/60',
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

export const HomePage: React.FC<HomePageProps> = ({ onNavigateToRoadmap, onNavigateToComingSoon }) => {
  const { isDark } = useTheme();
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const isUserInteracting = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const [activeCardId, setActiveCardId] = useState<string | null>('ws-engine');

  // Dynamic Work Summary State: Today vs Week vs Month with Directional Slide
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [displayPercent, setDisplayPercent] = useState<number>(86);

  // Auto-change Today's Work, Weekly Report, and Monthly Report every 2 seconds
  useEffect(() => {
    const timeframes: Array<'today' | 'week' | 'month'> = ['today', 'week', 'month'];
    const timer = setInterval(() => {
      setTimeframe((prev) => {
        const nextIdx = (timeframes.indexOf(prev) + 1) % timeframes.length;
        setSlideDirection('right');
        return timeframes[nextIdx];
      });
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  // 1.5-second live synchronization cycle: simultaneously re-triggers crosses in Box 1 (Red) and ticks in Box 2 (Green)
  const [animCycle, setAnimCycle] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimCycle((prev) => prev + 1);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Smooth dynamic counter animation for circular chart percentage
  useEffect(() => {
    const target = summaryData[timeframe].percentage;
    const start = displayPercent;
    const startTime = performance.now();
    const duration = 650;

    let animId: number;
    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease out
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(start + (target - start) * ease);
      setDisplayPercent(val);
      if (progress < 1) {
        animId = requestAnimationFrame(update);
      }
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [timeframe]);

  const handleTimeframeChange = (newTf: 'today' | 'week' | 'month') => {
    const order = { today: 0, week: 1, month: 2 };
    setSlideDirection(order[newTf] >= order[timeframe] ? 'right' : 'left');
    setTimeframe(newTf);
  };

  const handleOpenRoadmap = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    onNavigateToRoadmap();
  };

  // Work Summary Data configured dynamically
  const summaryData = {
    today: {
      title: "Today's Work Summary",
      periodLabel: "Synthesized at 18:00 • Ready for Standup",
      percentage: 86,
      strokeOffset: 35, // 251 * (1 - 0.86)
      deepWork: '5.2 hrs',
      streak: '5-day streak',
      stat1: { label: 'Commits Synced', val: '14' },
      stat2: { label: 'PRs Reviewed', val: '3' },
      stat3: { label: 'Tasks Closed', val: '8' },
      tasks: [
        { title: 'Phase 1 Architecture Initialized', time: '1h ago', desc: 'Monorepo workspaces, Express API, Prisma 7 PostgreSQL models.' },
        { title: 'Sub-10ms WebSocket Gateway Active', time: '3h ago', desc: 'Real-time event broadcasting live with peer reconnection.' },
        { title: 'Production Build Verified', time: '5h ago', desc: 'TypeScript strict mode compilation passed with 0 errors.' },
      ],
      bars: [45, 60, 85, 95, 75, 90, 86],
    },
    week: {
      title: "Weekly Sprint Report",
      periodLabel: "Week 1 Final Sprint Rollup",
      percentage: 94,
      strokeOffset: 15, // 251 * (1 - 0.94)
      deepWork: '28.5 hrs',
      streak: '12 days active',
      stat1: { label: 'Commits Synced', val: '68' },
      stat2: { label: 'PRs Reviewed', val: '16' },
      stat3: { label: 'Tasks Closed', val: '39' },
      tasks: [
        { title: 'Monorepo & Workspaces Architecture', time: 'Mon - Wed', desc: 'Configured npm workspaces, tsconfig strict mode, and unified scripts.' },
        { title: 'Prisma 7 Schemas & Database Layer', time: 'Wed - Thu', desc: 'Implemented driver adapters, PostgreSQL models, and migrations.' },
        { title: 'Connected Cards UI & Circular Transition', time: 'Fri', desc: 'Designed Truus-inspired animated slider and bidirectional reveal.' },
      ],
      bars: [65, 80, 92, 88, 95, 90, 94],
    },
    month: {
      title: "Monthly Workspace Analytics",
      periodLabel: "October 2026 Engineering Cycle",
      percentage: 98,
      strokeOffset: 5, // 251 * (1 - 0.98)
      deepWork: '118 hrs',
      streak: 'All sprints on track',
      stat1: { label: 'Commits Synced', val: '284' },
      stat2: { label: 'PRs Reviewed', val: '72' },
      stat3: { label: 'Milestones Hit', val: '6' },
      tasks: [
        { title: 'Platform Foundation & Zero-Lag Core', time: 'Oct 1 - Oct 10', desc: 'Built the sub-millisecond real-time bus and Prisma data layer.' },
        { title: 'Connected Activity Stream & Telemetry', time: 'Oct 11 - Oct 20', desc: 'Integrated universal ledger feeds and health telemetry metrics.' },
        { title: 'Autonomous Work Summaries Launch', time: 'Oct 21 - Present', desc: 'Deployed daily standup rollup engine and integrations suite.' },
      ],
      bars: [85, 90, 92, 95, 94, 98, 98],
    },
  };

  const currentSummary = summaryData[timeframe];

  const pauseAutoScrollTemporarily = (duration = 3500) => {
    isUserInteracting.current = true;
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      isUserInteracting.current = false;
    }, duration);
  };

  // Auto-scroll animation for cards slider: moves automatically slowly from left to right, smoothly yielding when user interacts
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    let animationId: number;
    const speed = 0.55;

    const autoScroll = () => {
      if (!isUserInteracting.current && slider) {
        slider.scrollLeft += speed;
        if (slider.scrollLeft >= slider.scrollWidth - slider.clientWidth - 2) {
          slider.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(autoScroll);
    };

    animationId = requestAnimationFrame(autoScroll);
    return () => {
      cancelAnimationFrame(animationId);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    pauseAutoScrollTemporarily(4000);
    const scrollAmount = 480;
    sliderRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleSliderMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    isDragging.current = true;
    pauseAutoScrollTemporarily(4000);
    startX.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeftStart.current = sliderRef.current.scrollLeft;
  };

  const handleSliderMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    sliderRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleSliderMouseUp = () => {
    if (isDragging.current) {
      isDragging.current = false;
      pauseAutoScrollTemporarily(3500);
    }
  };

  const handleSliderWheel = (e: React.WheelEvent) => {
    if (!sliderRef.current) return;
    pauseAutoScrollTemporarily(3500);
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      sliderRef.current.scrollLeft += e.deltaX;
    } else if (Math.abs(e.deltaY) > 2) {
      sliderRef.current.scrollLeft += e.deltaY * 0.85;
    }
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
          {/* Animated Main Headline: Opposite Directions (Stop Switching from Left-to-Right, Start Syncing from Right-to-Left) */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[1.08] select-none">
              <span className="block overflow-hidden py-1">
                <span className="inline-block animate-slide-left-cinematic-1 text-zinc-900 dark:text-white">
                  Stop Switching.
                </span>
              </span>
              <span className="block overflow-hidden py-1 mt-1 sm:mt-2">
                <span className="inline-block animate-slide-right-cinematic">
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-600 to-zinc-900 dark:from-white dark:via-zinc-300 dark:to-zinc-500 animate-text-shine">
                    Start Syncing.
                  </span>
                </span>
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
            {/* Card 1: Before Syncro // The Fragmented Stack (Red Box with Animated Crosses every 1.5s) */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-black border border-rose-500/25 shadow-xl relative overflow-hidden group hover:border-rose-500/50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  Before Syncro // The Fragmented Stack
                </span>

                {/* Animated Cross Badge (re-draws and wobbles every 1.5s) */}
                <div className="relative flex items-center justify-center p-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 animate-pulse-red group-hover:scale-110 transition-transform duration-300">
                  <svg
                    key={`badge-cross-${animCycle}`}
                    className="w-6 h-6 text-rose-500 animate-cross-wobble"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-40" />
                    <line x1="15" y1="9" x2="9" y2="15" className="animate-cross-draw" />
                    <line x1="9" y1="9" x2="15" y2="15" className="animate-cross-draw" style={{ animationDelay: '0.12s' }} />
                  </svg>
                </div>
              </div>



              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
                Constant Context Switching & Stale Data
              </h3>

              <ul className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
                {[
                  'Engineers toggle between 7+ browser tabs to track issues, PRs, chats, and calendars.',
                  'Board updates lag behind reality, requiring endless manual status checkups.',
                  'Sprint bottlenecks remain invisible until sprint reviews, causing missed deadlines.',
                  'Engineers spend 45 minutes daily writing manual standup summaries.'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3.5 group/item">
                    <div className="mt-0.5 shrink-0 w-5 h-5 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center group-hover/item:scale-125 group-hover/item:bg-rose-500/20 group-hover/item:border-rose-500/50 transition-all duration-300 shadow-[0_0_8px_rgba(244,63,94,0.15)]">
                      <svg
                        key={`cross-${animCycle}-${idx}`}
                        className="w-3.5 h-3.5 text-rose-500 animate-cross-draw animate-cross-wobble"
                        style={{ animationDelay: `${idx * 0.08}s` }}
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <line x1="4" y1="4" x2="12" y2="12" />
                        <line x1="12" y1="4" x2="4" y2="12" />
                      </svg>
                    </div>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Card 2: With Syncro // Connected Workspace (Green Box with Animated Ticks simultaneously every 1.5s) */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-black border border-emerald-500/35 shadow-xl relative overflow-hidden group hover:border-emerald-500/60 hover:shadow-2xl shadow-[0_0_25px_rgba(16,185,129,0.08)] transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  WITH SYNCRO // CONNECTED WORKSPACE
                </span>

                {/* Animated Tick Badge (re-draws and bounces every 1.5s) */}
                <div className="relative flex items-center justify-center p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 animate-pulse-green group-hover:scale-110 transition-transform duration-300">
                  <svg
                    key={`badge-tick-${animCycle}`}
                    className="w-6 h-6 text-emerald-500 animate-tick-bounce"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-40" />
                    <polyline points="9 12 11.5 14.5 16 9.5" className="animate-check-draw" />
                  </svg>
                </div>
              </div>



              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
                Instant State Synchronization & Telemetry
              </h3>

              <ul className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
                {[
                  'Single unified interface with bidirectional WebSockets syncing state sub-10ms.',
                  'Universal activity timeline automatically captures commits, task changes, and milestones.',
                  'Continuous workspace health telemetry alerts you to blockers before they stall work.',
                  'Autonomous daily rollups compile developer contributions automatically without meetings.'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3.5 group/item">
                    <div className="mt-0.5 shrink-0 w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 flex items-center justify-center group-hover/item:scale-125 group-hover/item:bg-emerald-500/20 group-hover/item:border-emerald-500/50 transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.25)]">
                      <svg
                        key={`tick-${animCycle}-${idx}`}
                        className="w-3.5 h-3.5 text-emerald-500 animate-check-draw animate-tick-bounce"
                        style={{ animationDelay: `${idx * 0.08}s` }}
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3.5 8.5 6.5 11.5 12.5 5.5" />
                      </svg>
                    </div>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section: Animated Marquee with Animated Floating Headline */}
      <section id="integrations-section" className="py-24 border-b border-black/10 dark:border-white/10 overflow-hidden bg-white dark:bg-black">
        <div className="max-w-6xl mx-auto px-6 text-center space-y-4 mb-14">

          {/* Animated Moving / Floating Headline */}
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white animate-text-wave">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-600 to-zinc-900 dark:from-white dark:via-zinc-300 dark:to-white animate-text-shine">
              Sync With Your Entire Toolchain
            </span>
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed animate-text-subwave">
            Connect GitHub, Zoom, Google Calendar, Meet, Slack, and your favorite developer utilities in real-time.
          </p>
        </div>

        {/* Infinite Moving Integrations Track (Left to Right) */}
        <div className="relative w-full overflow-hidden py-4">
          <div className="flex gap-4 animate-marquee-right whitespace-nowrap">
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

      {/* DYNAMIC ANIMATED WORK SUMMARY SECTION (Today, Week, Month with Working Circular Chart) */}
      <section id="features-section" className="py-28 max-w-6xl mx-auto px-6 scroll-mt-20">
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Award className="w-3.5 h-3.5" />
            <span>Workflow Intelligence & Analytics</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            One-Stop Place for All the Summary of Your Work
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Dynamic live observability over your completed deliverables, code velocity, and focus targets.
          </p>

          {/* Interactive Dynamic Switcher: Today's Work / Weekly Report / Monthly Report */}
          <div className="pt-4 flex justify-center">
            <div className="inline-flex items-center p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 text-xs sm:text-sm font-semibold shadow-inner">
              <button
                onClick={() => handleTimeframeChange('today')}
                className={`px-4 py-2 rounded-xl transition-all duration-300 ${timeframe === 'today'
                  ? 'bg-white dark:bg-black text-black dark:text-white shadow-md font-bold scale-[1.02]'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
              >
                Today's Work
              </button>
              <button
                onClick={() => handleTimeframeChange('week')}
                className={`px-4 py-2 rounded-xl transition-all duration-300 ${timeframe === 'week'
                  ? 'bg-white dark:bg-black text-black dark:text-white shadow-md font-bold scale-[1.02]'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
              >
                Weekly Report
              </button>
              <button
                onClick={() => handleTimeframeChange('month')}
                className={`px-4 py-2 rounded-xl transition-all duration-300 ${timeframe === 'month'
                  ? 'bg-white dark:bg-black text-black dark:text-white shadow-md font-bold scale-[1.02]'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
              >
                Monthly Report
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Animated Dashboard Container with Directional Sliding (Left / Right) */}
        <div
          key={timeframe}
          className={`grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch ${slideDirection === 'right' ? 'animate-slide-report-right' : 'animate-slide-report-left'
            }`}
        >
          {/* Column 1: Working Dynamic Circular Progress Chart */}
          <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-emerald-500/35 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-500">
                  Sprint Velocity Metric
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  {currentSummary.streak}
                </span>
              </div>

              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                Deliverables Completion
              </h3>

              {/* Dynamic Live Socket Beacon */}
              <div className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-black/5 dark:border-white/5 text-[11px] font-mono text-zinc-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="truncate">Live WebSocket Sync: 3.4ms latency • Active</span>
              </div>

              {/* Working Animated Circular Ring Chart with Orbiting Beacon */}
              {(() => {
                const strokeOffset = 251.3 * (1 - displayPercent / 100);
                const angleDeg = (displayPercent / 100) * 360 - 90;
                const angleRad = (angleDeg * Math.PI) / 180;
                const tipX = 50 + 40 * Math.cos(angleRad);
                const tipY = 50 + 40 * Math.sin(angleRad);

                return (
                  <div className="relative w-48 h-48 mx-auto flex items-center justify-center my-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Outer Background Track */}
                      <circle cx="50" cy="50" r="40" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="9" fill="none" />

                      {/* Dynamic Animated Outer Ring */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-emerald-500 transition-all duration-500 ease-out"
                        strokeWidth="9"
                        strokeDasharray="251.3"
                        strokeDashoffset={strokeOffset}
                        strokeLinecap="round"
                        fill="none"
                      />

                      {/* Orbiting Tip Indicator Dot */}
                      <circle cx={tipX} cy={tipY} r="4.5" className="fill-emerald-400 animate-ping" />
                      <circle cx={tipX} cy={tipY} r="3" className="fill-emerald-300" />

                      {/* Inner Secondary Ring */}
                      <circle cx="50" cy="50" r="28" className="stroke-zinc-200/50 dark:stroke-zinc-800/60" strokeWidth="5" fill="none" />
                      <circle
                        cx="50"
                        cy="50"
                        r="28"
                        className="stroke-purple-500 transition-all duration-500 ease-out"
                        strokeWidth="5"
                        strokeDasharray="175"
                        strokeDashoffset={strokeOffset * 0.7}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>

                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                        {displayPercent}%
                      </span>
                      <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold mt-0.5">
                        Live Progress
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Dynamic Waveform Bars */}
              <div className="pt-6 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-2">
                  <span>Activity Cadence</span>
                  <span className="text-emerald-500 font-bold">Real-time</span>
                </div>
                <div className="flex items-end gap-1.5 h-12 w-full pt-1">
                  {currentSummary.bars.map((val, idx) => (
                    <div key={idx} className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-t-md overflow-hidden relative group">
                      <div
                        className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-md transition-all duration-700 ease-out"
                        style={{ height: `${val}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-mono text-zinc-500">
              <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                <Flame className="w-4 h-4" /> Deep Focus: {currentSummary.deepWork}
              </span>
              <span>100% Synced</span>
            </div>
          </div>

          {/* Column 2 & 3: Detailed Work Accomplishment Feed */}
          <div className="lg:col-span-2 p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-black/10 dark:border-white/10 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                    Live Automated Synthesis
                  </span>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {currentSummary.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5 text-zinc-600 dark:text-zinc-300">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{currentSummary.periodLabel}</span>
                </div>
              </div>

              {/* Dynamic Stats Row */}
              <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-black border border-black/5 dark:border-white/10 shadow-sm">
                  <span className="block text-2xl font-black text-zinc-900 dark:text-white">{currentSummary.stat1.val}</span>
                  <span className="text-[11px] font-mono text-zinc-500">{currentSummary.stat1.label}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-black border border-black/5 dark:border-white/10 shadow-sm">
                  <span className="block text-2xl font-black text-zinc-900 dark:text-white">{currentSummary.stat2.val}</span>
                  <span className="text-[11px] font-mono text-zinc-500">{currentSummary.stat2.label}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-black border border-black/5 dark:border-white/10 shadow-sm">
                  <span className="block text-2xl font-black text-emerald-500">{currentSummary.stat3.val}</span>
                  <span className="text-[11px] font-mono text-zinc-500">{currentSummary.stat3.label}</span>
                </div>
              </div>

              {/* Accomplishment Items */}
              <div className="space-y-3.5 mb-6">
                {currentSummary.tasks.map((task, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-black/60 border border-black/10 dark:border-white/10 flex items-start gap-3.5 hover:border-emerald-500/30 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{task.title}</p>
                        <span className="text-[10px] font-mono text-zinc-500">{task.time}</span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        {task.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Summary Bar */}
            <div className="pt-4 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <span className="text-zinc-500">Zero sprint blockers detected • Real-time audit ready</span>
              <button
                onClick={handleOpenRoadmap}
                className="text-emerald-500 hover:text-emerald-400 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View Full Roadmap Deliverables</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* What We Provide As A Company: Interactive Modules Moving Slowly Left to Right */}
      <section
        id="company-services-section"
        className="py-24 max-w-7xl mx-auto px-6 overflow-hidden scroll-mt-20"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Product Portfolio</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              What We Provide As A Company
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl">
              Engineered real-time collaboration modules. Click on any card to toggle detailed deliverables.
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

        {/* Truus-Style Interactive Connecting Wire SVG with animated pulses */}
        <div className="relative mb-6 hidden md:block">
          <svg className="w-full h-8 text-black/15 dark:text-white/20" viewBox="0 0 1000 30" fill="none">
            <path
              d="M 10 15 Q 250 -10, 500 15 T 990 15"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              className="animate-pulse"
            />
            <circle cx="250" cy="8" r="4.5" className="fill-emerald-400 animate-ping" />
            <circle cx="500" cy="15" r="4.5" className="fill-purple-400 animate-ping" />
            <circle cx="750" cy="22" r="4.5" className="fill-sky-400 animate-ping" />
          </svg>
        </div>

        {/* Horizontal Slider: Smooth Drag, Scroll Wheel, Chevron Arrows & Auto-glide */}
        <div
          ref={sliderRef}
          onMouseDown={handleSliderMouseDown}
          onMouseMove={handleSliderMouseMove}
          onMouseUp={handleSliderMouseUp}
          onMouseLeave={handleSliderMouseUp}
          onWheel={handleSliderWheel}
          onTouchStart={() => pauseAutoScrollTemporarily(5000)}
          onTouchEnd={() => pauseAutoScrollTemporarily(3500)}
          className="flex gap-6 overflow-x-auto pb-8 pt-2 select-none cursor-grab active:cursor-grabbing scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {COMPANY_SERVICES.map((card) => {
            const isExpanded = activeCardId === card.id;

            return (
              <div
                key={card.id}
                onClick={() => setActiveCardId(isExpanded ? null : card.id)}
                className={`shrink-0 w-[88vw] sm:w-[420px] md:w-[470px] p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border ${card.accentBorder} shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col justify-between group cursor-pointer relative hover:-translate-y-1 hover:scale-[1.01]`}
              >
                <div>
                  {/* Header Tag with Truus-style wiggle icon */}
                  <div className="flex items-center justify-between mb-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider ${card.accentBg} ${card.accent}`}>
                      {card.tag}
                    </span>
                    <div className="p-2 rounded-xl bg-white dark:bg-black border border-black/10 dark:border-white/10 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300">
                      <Sparkles className={`w-4 h-4 ${card.accent}`} />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">
                    {card.title}
                  </h3>

                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                    {card.description}
                  </p>

                  {/* Truus-Style Elastic Reveal of Detailed Deliverables & Bullets */}
                  <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded
                    ? 'grid-rows-[1fr] opacity-100 mt-2'
                    : 'grid-rows-[0fr] opacity-0'
                    }`}>
                    <div className="overflow-hidden">
                      {/* Truus-Style Hand Drawn Divider line */}
                      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-black/20 dark:via-white/20 to-transparent my-4 group-hover:via-emerald-500 transition-colors duration-500" />

                      <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
                        Core Capabilities:
                      </p>
                      <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                        {card.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 transform transition-transform duration-300 group-hover:translate-x-1">
                            <span className={`font-bold ${card.accent} mt-0.5`}>•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Collapsed Hint */}
                  {!isExpanded && (
                    <div className="pt-3 flex items-center gap-2 text-xs font-mono text-zinc-500 group-hover:text-emerald-500 transition-colors">
                      <span className="font-bold">+</span>
                      <span>Hover or click to view deliverables</span>
                    </div>
                  )}
                </div>

                {/* Card Footer Ticker */}
                <div className="mt-8 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-mono text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    STATUS: READY
                  </span>
                  <span className={`${card.accent} font-bold group-hover:underline`}>
                    ACTIVE MODULE ↗
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Clean Single Line Link to Roadmap */}
      <section className="py-12 text-center">
        <button
          onClick={handleOpenRoadmap}
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
