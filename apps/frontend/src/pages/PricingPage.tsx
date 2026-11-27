import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Bento } from '../components/ui';
import { HandArrow, HandNote, Reveal } from '../components/brand';

/** Pricing: one clear recommended plan (Von Restorff) beside the plans that are coming. */
const PLANS = [
  {
    name: 'Beta',
    price: 'Free',
    note: 'while in beta',
    pitch: 'Everything Syncro does today, for your whole team.',
    features: ['Unlimited workspaces & members', 'Kanban board with drag & drop', 'Live timers & timesheets', 'Auto-written standups', 'Instant rooms, Google Meet, Zoom', 'GitHub & Google Calendar'],
    cta: true,
  },
  {
    name: 'Team',
    price: 'Coming soon',
    note: '',
    pitch: 'For growing teams that need more control.',
    features: ['Everything in Beta', 'Recurring cards & templates', 'Advanced timesheet reports', 'Guest access'],
  },
  {
    name: 'Business',
    price: 'Coming soon',
    note: '',
    pitch: 'For companies running many teams.',
    features: ['Everything in Team', 'SSO & audit exports', 'Priority support'],
  },
];

export const PricingPage: React.FC = () => {
  const { status } = useAuth();
  const authed = status === 'authenticated';
  return (
    <div className="px-4 pb-24 pt-14 sm:px-6 sm:pt-20">
      <Reveal className="mx-auto max-w-2xl text-center">
        <HandNote className="text-2xl text-emerald-600 dark:text-emerald-400" rotate={-2}>
          simple, honest pricing
        </HandNote>
        <h1 className="mt-1 font-hand text-[clamp(2.6rem,6vw,4.2rem)] font-bold leading-[1] text-black dark:text-white">Free while we&apos;re in beta</h1>
        <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">Use every feature with your whole team. Paid plans will add extras — never take away what you have.</p>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-5xl items-start gap-4 md:grid-cols-3">
        {PLANS.map((p, i) => (
          <Reveal key={p.name} delay={i * 90} className="relative">
            {p.cta && (
              <div className="absolute -top-9 right-4 z-10 flex items-end gap-1">
                <HandNote className="text-xl text-emerald-600 dark:text-emerald-400" rotate={-4}>
                  start here
                </HandNote>
                <HandArrow className="h-8 w-10 rotate-[30deg] text-emerald-500" />
              </div>
            )}
            <Bento className={`flex h-full flex-col ${p.cta ? '!border-emerald-500/50 ring-4 ring-emerald-500/10' : 'opacity-90'}`}>
              <div className="font-hand text-3xl font-bold text-black dark:text-white">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`font-extrabold tracking-tight text-black dark:text-white ${p.cta ? 'text-4xl' : 'text-2xl'}`}>{p.price}</span>
                {p.note && <span className="text-sm text-zinc-500">{p.note}</span>}
              </div>
              <p className="mt-2 text-[0.95rem] text-zinc-500 dark:text-zinc-400">{p.pitch}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[0.95rem] text-zinc-700 dark:text-zinc-300">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.cta ? 'text-emerald-500' : 'text-zinc-400'}`} /> {f}
                  </li>
                ))}
              </ul>
              {p.cta ? (
                <Link
                  to={authed ? '/app' : '/signup'}
                  className="group mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-bold text-white transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  {authed ? 'Open your workspace' : 'Start free'} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <div className="mt-6 flex min-h-[48px] items-center justify-center rounded-xl border border-dashed border-black/15 text-sm font-medium text-zinc-500 dark:border-white/15">
                  Included free during beta
                </div>
              )}
            </Bento>
          </Reveal>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
