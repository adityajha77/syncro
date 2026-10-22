import React, { useState } from 'react';
import { Layers, GitBranch, Terminal, Check } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyClone = () => {
    navigator.clipboard.writeText('git clone https://github.com/adityajha77/syncro.git');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="border-b border-white/10 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black font-extrabold shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-transform hover:scale-105">
            <Layers className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-white tracking-tight">Syncro</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 border border-white/10 px-1.5 py-0.5 rounded">
              v0.1
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Interactive Clone Button */}
          <button
            onClick={handleCopyClone}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-950 border border-white/10 hover:border-white/30 text-zinc-400 hover:text-white transition-all active:scale-95 shadow-sm"
            title="Click to copy clone command"
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span>git clone</span>
            {copied ? (
              <span className="flex items-center gap-1 text-emerald-400 font-sans font-medium text-[11px]">
                <Check className="w-3 h-3" /> Copied!
              </span>
            ) : null}
          </button>

          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-950 border border-white/15 text-zinc-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <span className="tracking-tight text-[11px]">Phase 1 Active</span>
          </div>

          {/* GitHub Link */}
          <a
            href="https://github.com/adityajha77/syncro"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-zinc-950 hover:bg-zinc-900 border border-white/10 hover:border-white/20 transition-all"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Repo</span>
          </a>
        </div>
      </div>
    </header>
  );
};
