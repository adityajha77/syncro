import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  KeyRound,
  Loader2,
  MessageSquare,
  MousePointerClick,
  Play,
  Radio,
  Sparkles,
  SquareKanban,
  Timer,
  Video,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Avatar, Bento, CountUp, GithubIcon, IconTile, RingGauge, useToast } from '../components/ui';
import { GoogleCalendarMark, HandArrow, HandCircle, HandNote, MeetMark, Reveal, Scribble, StickyNote, Tilt, TypewriterFade, ZoomMark } from '../components/brand';
import { PlayBoard } from '../components/PlayBoard';
import { clock, useNow } from '../lib/workflow';

// ==========================================
// Feature tile visuals
// ==========================================
const TimerVisual: React.FC = () => {
  const now = useNow(1000);
  const people = [
    { name: 'Rohan Iyer', task: 'Realtime notifications', s: 2832 },
    { name: 'Sara Khan', task: 'Mobile nav polish', s: 1104 },
  ];
  return (
    <ul className="space-y-2">
      {people.map((p) => (
        <li key={p.name} className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-2">
          <Avatar name={p.name} size="xs" className="!ring-0" />
          <span className="min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300">{p.task}</span>
          <span className="font-mono text-sm font-bold tabular-nums text-black dark:text-white">{clock(p.s + (now / 1000) % 3600)}</span>
        </li>
      ))}
    </ul>
  );
};

const BarsVisual: React.FC = () => (
  <div className="flex h-24 items-end gap-2">
    {[
      [38, 22],
      [52, 30],
      [44, 36],
      [60, 24],
      [30, 18],
    ].map(([a, b], i) => (
      <div key={i} className="flex flex-1 flex-col-reverse gap-[2px]">
        <div className="rounded-b-sm" style={{ height: a, background: 'var(--series-1)' }} />
        <div className="rounded-t" style={{ height: b, background: 'var(--series-2)' }} />
      </div>
    ))}
  </div>
);

const tileTitle = 'font-hand text-[1.75rem] font-bold leading-tight text-black dark:text-white';
const tileText = 'mt-1 text-[0.95rem] leading-relaxed text-zinc-500 dark:text-zinc-400';

// ==========================================
// PAGE
// ==========================================
export const HomePage: React.FC = () => {
  const { status, loginDemo } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const authed = status === 'authenticated';
  const [demo, setDemo] = useState<'unknown' | 'yes' | 'no'>('unknown');
  const [demoBusy, setDemoBusy] = useState(false);

  useEffect(() => {
    api.demoAvailable().then((r) => setDemo(r.available ? 'yes' : 'no'), () => setDemo('no'));
  }, []);

  const openDemo = async () => {
    setDemoBusy(true);
    try {
      await loginDemo();
      navigate('/app?view=board');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Could not open the demo');
      setDemoBusy(false);
    }
  };

  const primaryCta = authed ? (
    <Link to="/app" className="group inline-flex min-h-[52px] items-center gap-2 rounded-2xl bg-black px-7 text-base font-bold text-white shadow-xl shadow-black/10 transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-zinc-200">
      Open your workspace <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  ) : (
    <Link to="/signup" className="group inline-flex min-h-[52px] items-center gap-2 rounded-2xl bg-black px-7 text-base font-bold text-white shadow-xl shadow-black/10 transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-zinc-200">
      Start free <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );

  return (
    <div className="relative overflow-x-clip">
      {/* ================= HERO ================= */}
      <section className="relative px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern mask-radial" />
        <div className="relative mx-auto max-w-5xl text-center">

          <h1 className="mt-2 select-none text-[clamp(3.4rem,9.5vw,7.4rem)] font-bold leading-[0.95]">
            <span className="animate-slide-left-cinematic-1 block text-zinc-900 dark:text-white">Stop Switching.</span>
            <span className="animate-slide-right-cinematic relative inline-block">
              <span className="inline-block pb-[0.14em] text-zinc-900 dark:text-white">
                Start Syncing.
              </span>
              <Scribble className="absolute -bottom-[0.06em] left-[42%] h-[0.28em] w-[56%] text-emerald-500" delay="1.2s" />
            </span>
          </h1>

          <p className="fade-up mx-auto mt-5 min-h-[3.5rem] text-xl font-semibold sm:min-h-0 text-zinc-800 dark:text-zinc-200 sm:text-2xl" style={{ animationDelay: '250ms' }}>
            One place for your{' '}
            <TypewriterFade
              phrases={["team's tasks.", 'live timers.', 'daily standups.', 'Zoom & Meet calls.', 'GitHub commits.']}
              className="text-emerald-600 dark:text-emerald-400"
              caretClass="bg-emerald-500"
            />
          </p>
          <p className="fade-up mx-auto mt-3 max-w-2xl text-base leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-lg" style={{ animationDelay: '350ms' }}>
            Plan on a drag-and-drop board, see who is working on what right now, and jump into a call — without opening another tab.
          </p>

          <div className="fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: '450ms' }}>
            {primaryCta}
            {!authed && demo === 'yes' ? (
              <button
                onClick={openDemo}
                disabled={demoBusy}
                className="inline-flex min-h-[52px] items-center gap-2 rounded-2xl border border-black/10 bg-white px-6 text-base font-semibold text-zinc-800 shadow-sm transition hover:border-black/30 disabled:opacity-60 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-white/40"
              >
                {demoBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <MousePointerClick className="h-5 w-5" />} Try the live demo
              </button>
            ) : (
              <a
                href="#how"
                className="inline-flex min-h-[52px] items-center gap-2 rounded-2xl border border-black/10 bg-white px-6 text-base font-semibold text-zinc-800 shadow-sm transition hover:border-black/30 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-white/40"
              >
                See how it works
              </a>
            )}
          </div>
          <div className="mt-3 hidden justify-center sm:flex">
            <HandNote className="text-xl" rotate={-2}>
              free while in beta · no credit card
            </HandNote>
          </div>
        </div>

        {/* ---------- live preview with margin notes ---------- */}
        <div className="relative mx-auto mt-12 max-w-5xl sm:mt-16">
          <div className="absolute -top-10 z-10 hidden w-44 xl:-left-36 xl:block 2xl:-left-48">
            <StickyNote rotate={-5}>timers start the moment work does ⏱</StickyNote>
            <HandArrow className="ml-24 mt-1 h-14 w-20 text-zinc-400" delay="1.6s" />
          </div>
          <div className="absolute top-24 z-10 hidden w-44 xl:-right-36 xl:block 2xl:-right-48">
            <StickyNote rotate={4} tone="emerald">
              everyone sees who&apos;s working, live ⏱
            </StickyNote>
          </div>
          <div className="absolute -bottom-12 right-10 z-10 hidden items-end gap-1 md:flex">
            <HandArrow flip className="h-12 w-16 -rotate-12 text-zinc-400" delay="2s" />
            <HandNote className="text-2xl" rotate={-4}>
              join the call without leaving
            </HandNote>
          </div>
          <div className="not-hand">
            <PlayBoard />
          </div>
        </div>
      </section>

      {/* ================= BEFORE / AFTER ================= */}
      <section className="px-4 pb-8 pt-24 sm:px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
          <Reveal>
            <Bento className="relative">
              <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">Before</div>
              <div className="flex flex-wrap gap-2">
                {['Task board', 'Time tracker', 'Zoom', 'Slack', 'Google Calendar', 'GitHub', 'Notion', 'Sheets', 'Standup doc'].map((t, i) => (
                  <span
                    key={t}
                    className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-sm text-zinc-500 line-through decoration-red-400/70 decoration-2 dark:border-white/10 dark:bg-black"
                    style={{ transform: `rotate(${((i * 37) % 7) - 3}deg)` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <HandNote className="mt-4 text-2xl text-red-500 dark:text-red-400" rotate={-3}>
                9 tabs. zero context.
              </HandNote>
            </Bento>
          </Reveal>
          <HandArrow className="mx-auto hidden h-16 w-24 text-zinc-400 md:block" />
          <Reveal delay={120}>
            <Bento className="relative">
              <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">With Syncro</div>
              <ul className="space-y-2 text-[0.95rem] text-zinc-700 dark:text-zinc-300">
                {['Board, timers and standups in one tab', 'Calls start from the card you are discussing', 'Everything lands in one activity timeline'].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {t}
                  </li>
                ))}
              </ul>
              <HandNote className="mt-4 text-2xl text-emerald-600 dark:text-emerald-400" rotate={-2}>
                1 tab. everything live.
              </HandNote>
            </Bento>
          </Reveal>
        </div>
      </section>

      {/* ================= FEATURES (bento) ================= */}
      <section id="features" className="scroll-mt-24 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <HandNote className="text-2xl text-emerald-600 dark:text-emerald-400" rotate={-2}>
              everything your workflow needs
            </HandNote>
            <h2 className="mt-1 font-hand text-[clamp(2.6rem,6vw,4.2rem)] font-bold leading-[1] text-black dark:text-white">
              From plan to shipped, in one place
            </h2>
            <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">Every tile below is a real, working part of Syncro — not a mockup.</p>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-3">
            <Reveal className="md:col-span-2">
              <Bento className="h-full">
                <IconTile tone="emerald" className="mb-4">
                  <SquareKanban className="h-5 w-5" />
                </IconTile>
                <h3 className={tileTitle}>A board you just drag and drop</h3>
                <p className={tileText}>To Do → In Progress → Review → Done with drag & drop, checklists, comments, estimates and a WIP warning when too much is in flight.</p>
                <div className="mt-5 grid grid-cols-4 gap-2">
                  {[
                    ['To Do', 'bg-zinc-400', 3],
                    ['In Progress', 'bg-amber-500', 2],
                    ['Review', 'bg-violet-500', 1],
                    ['Done', 'bg-emerald-500', 3],
                  ].map(([l, d, n]) => (
                    <div key={l as string} className="rounded-xl border border-black/[0.06] bg-white/70 p-2 dark:border-white/[0.06] dark:bg-black/40">
                      <div className="mb-1.5 flex items-center gap-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                        <span className={`h-1.5 w-1.5 rounded-full ${d}`} /> <span className="truncate">{l}</span>
                      </div>
                      {Array.from({ length: n as number }).map((_, i) => (
                        <div key={i} className="mb-1.5 h-5 rounded-md bg-black/[0.05] dark:bg-white/[0.07]" />
                      ))}
                    </div>
                  ))}
                </div>
              </Bento>
            </Reveal>
            <Reveal delay={80}>
              <Bento className="h-full">
                <IconTile tone="amber" className="mb-4">
                  <Timer className="h-5 w-5" />
                </IconTile>
                <h3 className={tileTitle}>Live timers, visible to the team</h3>
                <p className={`${tileText} mb-4`}>Press play on a card. Your teammates see it tick.</p>
                <TimerVisual />
              </Bento>
            </Reveal>

            <Reveal>
              <Bento className="h-full">
                <IconTile tone="sky" className="mb-4">
                  <Video className="h-5 w-5" />
                </IconTile>
                <h3 className={tileTitle}>Meetings, built in</h3>
                <p className={`${tileText} mb-4`}>Instant rooms in one click, plus real Google Meet and Zoom links.</p>
                <div className="flex flex-wrap gap-2">
                  {['Instant room', 'Google Meet', 'Zoom'].map((p, i) => (
                    <span key={p} className="flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1 text-sm font-medium text-zinc-700 dark:border-white/10 dark:text-zinc-300">
                      <span className={`h-2 w-2 rounded-full ${['bg-emerald-500', 'bg-sky-500', 'bg-blue-600'][i]}`} /> {p}
                    </span>
                  ))}
                </div>
              </Bento>
            </Reveal>
            <Reveal delay={80}>
              <Bento className="h-full">
                <IconTile tone="violet" className="mb-4">
                  <Sparkles className="h-5 w-5" />
                </IconTile>
                <h3 className={tileTitle}>Standups that write themselves</h3>
                <p className={`${tileText} mb-3`}>Done, doing and blockers — from real cards, timers and commits.</p>
                <div className="hand space-y-0.5 text-xl leading-snug text-zinc-700 dark:text-zinc-300">
                  <div>
                    <span className="text-emerald-600 dark:text-emerald-400">done:</span> SSO with Google
                  </div>
                  <div>
                    <span className="text-amber-600 dark:text-amber-400">doing:</span> checkout redesign
                  </div>
                  <div>
                    <span className="text-red-500">blocked:</span> flaky webhook test
                  </div>
                </div>
              </Bento>
            </Reveal>
            <Reveal delay={160}>
              <Bento className="flex h-full flex-col">
                <IconTile tone="emerald" className="mb-4">
                  <Activity className="h-5 w-5" />
                </IconTile>
                <h3 className={tileTitle}>Workspace health</h3>
                <p className={tileText}>On-time work and completion, scored live.</p>
                <div className="mt-4 flex flex-1 items-center justify-center">
                  <RingGauge value={82} size={112} stroke={10} tone="good">
                    <span className="text-2xl font-extrabold text-black dark:text-white">
                      <CountUp value={82} suffix="%" />
                    </span>
                  </RingGauge>
                </div>
              </Bento>
            </Reveal>

            <Reveal>
              <Bento className="h-full">
                <IconTile tone="rose" className="mb-4">
                  <MessageSquare className="h-5 w-5" />
                </IconTile>
                <h3 className={tileTitle}>One activity timeline</h3>
                <ul className="mt-4 space-y-3">
                  {[
                    ['Priya Sharma', 'completed "SSO with Google"', 'bg-emerald-500'],
                    ['Rohan Iyer', 'started working on "Notifications"', 'bg-sky-500'],
                    ['Aarav Mehta', 'pushed 3 commits to main', 'bg-violet-500'],
                  ].map(([n, s, d]) => (
                    <li key={s} className="flex items-center gap-2.5 text-sm">
                      <span className="relative">
                        <Avatar name={n!} size="xs" className="!ring-0" />
                        <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-black ${d}`} />
                      </span>
                      <span className="min-w-0 truncate text-zinc-600 dark:text-zinc-300">
                        <b className="font-semibold text-black dark:text-white">{n!.split(' ')[0]}</b> {s}
                      </span>
                    </li>
                  ))}
                </ul>
              </Bento>
            </Reveal>
            <Reveal delay={80} className="md:col-span-2">
              <Bento className="h-full">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
                  <div className="sm:w-1/2">
                    <IconTile tone="amber" className="mb-4">
                      <BarChart3 className="h-5 w-5" />
                    </IconTile>
                    <h3 className={tileTitle}>Timesheets without the spreadsheet</h3>
                    <p className={tileText}>Hours per day and per person, top cards, manual logging (&ldquo;1h 30m&rdquo; just works) and CSV export.</p>
                  </div>
                  <div className="sm:w-1/2">
                    <BarsVisual />
                  </div>
                </div>
              </Bento>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how" className="scroll-mt-24 border-y border-black/10 bg-zinc-50/70 px-4 py-24 dark:border-white/10 dark:bg-zinc-950/50 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-14 text-center">
            <HandNote className="text-2xl" rotate={-2}>
              takes about two minutes
            </HandNote>
            <h2 className="mt-1 font-hand text-[clamp(2.6rem,6vw,4.2rem)] font-bold leading-[1] text-black dark:text-white">How it works</h2>
          </Reveal>
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-6">
            {/* dashed hand-drawn path behind the steps */}
            <svg className="pointer-events-none absolute left-[16%] right-[16%] top-8 hidden h-6 md:block" viewBox="0 0 600 24" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 12 C 150 0, 300 24, 600 10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 8" className="text-zinc-300 dark:text-zinc-700" />
            </svg>
            {[
              { n: '1', icon: <Zap className="h-5 w-5" />, title: 'Create a workspace', text: 'Sign up and your first workspace is ready instantly.' },
              {
                n: '2',
                icon: <KeyRound className="h-5 w-5" />,
                title: 'Invite with a code',
                text: (
                  <>
                    Share a code like <span className="rounded-md border border-black/10 bg-white px-1.5 font-mono text-sm dark:border-white/10 dark:bg-black">K7QX-M2PA</span> — teammates join in one click.
                  </>
                ),
              },
              { n: '3', icon: <Radio className="h-5 w-5" />, title: 'Drag, track, ship', text: 'Move cards, run timers, hop on calls. Everyone sees it live.' },
            ].map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 120} className="relative text-center">
                <div className="relative mx-auto w-fit">
                  <IconTile tone={(['emerald', 'violet', 'sky'] as const)[i]} size="lg" className="!h-16 !w-16 !rounded-2xl">
                    {s.icon}
                  </IconTile>
                  <span className="hand absolute -right-4 -top-5 text-4xl text-emerald-600 dark:text-emerald-400">{s.n}</span>
                </div>
                <h3 className="mt-5 font-hand text-[1.9rem] font-bold leading-tight text-black dark:text-white">{s.title}</h3>
                <p className="mx-auto mt-1.5 max-w-xs text-[0.95rem] leading-relaxed text-zinc-500 dark:text-zinc-400">{s.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= INTEGRATIONS ================= */}
      <section id="integrations" className="scroll-mt-24 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-10 text-center">
            <h2 className="font-hand text-[clamp(2.6rem,6vw,4.2rem)] font-bold leading-[1] text-black dark:text-white">Works with the tools you already use</h2>
            <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">Connect once from your profile. Tokens are encrypted at rest.</p>
          </Reveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { name: 'GitHub', what: 'Commits in your timeline', icon: <GithubIcon className="h-7 w-7 text-black dark:text-white" /> },
              { name: 'Google Calendar', what: 'Your events, synced', icon: <GoogleCalendarMark className="h-7 w-7" /> },
              { name: 'Google Meet', what: 'Real Meet links', icon: <MeetMark className="h-7 w-7" /> },
              { name: 'Zoom', what: 'Schedule Zoom calls', icon: <ZoomMark className="h-7 w-7" /> },
              { name: 'Instant rooms', what: 'No account needed', icon: <Zap className="h-6 w-6 text-emerald-500" /> },
            ].map((x, i) => (
              <Reveal key={x.name} delay={i * 60} className="h-full">
                <Tilt max={8} className="h-full">
                  <Bento className="flex h-full flex-col items-center !p-5 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-black/10 bg-white shadow-md transition-transform group-hover:-translate-y-0.5 dark:border-white/10 dark:bg-zinc-900">{x.icon}</div>
                    <div className="font-bold text-black dark:text-white">{x.name}</div>
                    <div className="mt-0.5 text-sm text-zinc-500">{x.what}</div>
                  </Bento>
                </Tilt>
              </Reveal>
            ))}
          </div>
          <div className="mt-5 text-center">
            <HandNote className="text-xl" rotate={-1}>
              next up: Slack, Figma &amp; Notion
            </HandNote>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA (Peak-End) ================= */}
      <section className="px-4 pb-24 sm:px-6">
        <Reveal className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[2rem] bg-black px-6 py-16 text-center text-white dark:bg-white dark:text-black sm:px-12">
            <div className="glow-cycle pointer-events-none absolute -left-20 -top-24 h-80 w-80 rounded-full blur-3xl" />
            <div className="glow-cycle-2 pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full blur-3xl" />
            <h2 className="relative font-hand text-[clamp(2.8rem,7vw,4.8rem)] font-bold leading-[1]">
              Your whole workflow.{' '}
              <span className="relative inline-block">
                One tab.
                <HandCircle className="absolute -inset-x-4 -inset-y-3 h-[calc(100%+1.5rem)] w-[calc(100%+2rem)] text-emerald-400 dark:text-emerald-600" />
              </span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/70 dark:text-black/60">Set up your team in two minutes. It&apos;s free while we&apos;re in beta.</p>
            <div className="relative mt-7 flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-6">
              <Link
                to={authed ? '/app' : '/signup'}
                className="hand-link group inline-flex min-h-[52px] -rotate-2 items-center gap-2 rounded-xl px-2 text-[2.1rem] font-bold text-emerald-300 transition hover:text-emerald-200 dark:text-emerald-700 dark:hover:text-emerald-800"
              >
                {authed ? 'open your workspace' : 'create your workspace'}
                <ArrowRight className="h-7 w-7 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
              {!authed && demo === 'yes' && (
                <button
                  onClick={openDemo}
                  disabled={demoBusy}
                  className="hand-link group inline-flex min-h-[48px] rotate-1 items-center gap-2 rounded-xl px-2 text-[1.6rem] font-semibold text-white/75 transition hover:text-white disabled:opacity-60 dark:text-black/65 dark:hover:text-black"
                >
                  {demoBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />} or explore the demo
                </button>
              )}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-black/10 px-4 py-10 dark:border-white/10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-zinc-500 sm:flex-row">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Syncro · Stop switching. Start syncing.</span>
          <nav className="flex gap-5">
            <a href="#features" className="hover:text-black dark:hover:text-white">
              Features
            </a>
            <a href="#integrations" className="hover:text-black dark:hover:text-white">
              Integrations
            </a>
            <Link to={authed ? '/app' : '/login'} className="hover:text-black dark:hover:text-white">
              {authed ? 'Workspace' : 'Sign in'}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
