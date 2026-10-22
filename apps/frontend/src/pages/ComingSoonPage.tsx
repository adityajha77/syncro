import React from 'react';
import { ArrowLeft, Sparkles, Bell, CheckCircle2 } from 'lucide-react';

interface ComingSoonPageProps {
  title?: string;
  subtitle?: string;
  onBack: () => void;
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ 
  title = 'Coming Soon', 
  subtitle = 'We are currently crafting this feature. Stay tuned for the upcoming release.',
  onBack 
}) => {
  const [email, setEmail] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setEmail('');
    }
  };

  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-center px-6 py-20 overflow-hidden bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern mask-radial pointer-events-none opacity-40 dark:opacity-60" />

      {/* Ambient Top Light Spotlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-b from-black/[0.04] dark:from-white/[0.08] to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
        {/* Back Button */}
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-950 border border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </button>
        </div>

        {/* Small Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-tight bg-zinc-100 dark:bg-zinc-950 border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-400 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>EARLY ACCESS // SPRINT ROADMAP</span>
        </div>

        {/* Big Faded Stylish Typography: COMING SOON */}
        <div className="space-y-3">
          <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter uppercase select-none leading-none">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-800 via-zinc-400 to-zinc-200 dark:from-white dark:via-zinc-400 dark:to-zinc-800 opacity-90">
              {title}
            </span>
          </h1>

          <p className="text-base sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed font-normal pt-2">
            {subtitle}
          </p>
        </div>

        {/* Early Access Notification Input */}
        <form onSubmit={handleSubmit} className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-md mx-auto">
          <input
            type="email"
            required
            placeholder="Enter your work email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full sm:flex-1 px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/10 dark:border-white/10 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition-all shadow-sm"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4" />
            <span>Notify Me</span>
          </button>
        </form>

        {subscribed && (
          <p className="text-xs font-mono text-emerald-500 flex items-center justify-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>You're on the early access priority list!</span>
          </p>
        )}
      </div>
    </div>
  );
};
