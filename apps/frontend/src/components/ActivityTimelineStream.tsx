import React, { useState } from 'react';
import { Activity } from 'lucide-react';

interface ActivityItem {
  id: string;
  type?: string;
  summary: string;
  createdAt: string;
  actor: {
    name: string;
  };
}

interface ActivityTimelineStreamProps {
  activities?: ActivityItem[];
  activityDot?: any;
  icon?: any;
}

export const ActivityTimelineStream: React.FC<ActivityTimelineStreamProps> = ({
  activities = [],
  activityDot = {},
  icon,
}) => {
  const [filter, setFilter] = useState<'all' | 'task' | 'calendar' | 'commit'>('all');

  const formatTimeAgo = (dateStr: string) => {
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const filtered = activities.filter(a => {
    if (filter === 'all') return true;
    const s = (a.summary || '').toLowerCase();
    const t = (a.type || '').toLowerCase();
    if (filter === 'task') return t.includes('task') || s.includes('task');
    if (filter === 'calendar') return t.includes('calendar') || t.includes('event') || s.includes('sync');
    if (filter === 'commit') return t.includes('commit') || s.includes('commit') || s.includes('push');
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header with Title and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300">
            {icon || <Activity className="h-5 w-5 text-emerald-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-100">
                Unified Activity Timeline Stream
              </h3>
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Feed
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Everything that happened, in one filtered chronological timeline
            </p>
          </div>
        </div>

        {/* Filter Pills matching Jet Black theme */}
        <div className="flex items-center gap-1 bg-black/60 border border-white/10 p-1 rounded-xl self-start sm:self-auto">
          {(['all', 'task', 'calendar', 'commit'] as const).map(tab => {
            const count = tab === 'all' 
              ? activities.length 
              : activities.filter(a => {
                  const s = (a.summary || '').toLowerCase();
                  const t = (a.type || '').toLowerCase();
                  if (tab === 'task') return t.includes('task') || s.includes('task');
                  if (tab === 'calendar') return t.includes('calendar') || t.includes('event') || s.includes('sync');
                  if (tab === 'commit') return t.includes('commit') || s.includes('commit') || s.includes('push');
                  return false;
                }).length;

            const labels = { all: 'All', task: 'Tasks', calendar: 'Calendar', commit: 'Commits' };
            const isActive = filter === tab;

            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/15 text-white shadow-sm border border-white/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                {labels[tab]} {count > 0 && <span className="text-[10px] text-zinc-400 ml-0.5">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline Stream using exact Jet Black styling */}
      <ol className="relative -mr-2 max-h-[26rem] flex-1 overflow-y-auto pr-2">
        {filtered.length === 0 ? (
          <li className="py-8 text-center text-sm text-zinc-400">
            No activity in this category yet.
          </li>
        ) : (
          filtered.map((a, i) => {
            const isTask = a.type?.toLowerCase().includes('task') || a.summary?.toLowerCase().includes('task');
            const isSync = a.summary?.toLowerCase().includes('sync');
            const isCommit = a.summary?.toLowerCase().includes('commit');
            const fallbackDot = isTask ? 'bg-emerald-500' : isSync ? 'bg-amber-500' : isCommit ? 'bg-purple-500' : 'bg-cyan-500';
            const dotColor = (a.type && activityDot[a.type]) ? activityDot[a.type] : fallbackDot;

            return (
              <li key={a.id} className="relative flex gap-3 pb-4">
                {i < filtered.length - 1 && (
                  <span className="absolute left-[15px] top-9 h-[calc(100%-2rem)] w-px bg-white/10" />
                )}
                <div className="relative shrink-0">
                  <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-semibold text-zinc-200">
                    {a.actor?.name?.slice(0, 2).toUpperCase() || 'SR'}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-black ${dotColor}`} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="break-words text-sm leading-snug text-zinc-300">
                    <span className="font-semibold text-zinc-100">{a.actor?.name}</span> {a.summary}
                  </p>
                  <span className="text-xs text-zinc-400">{formatTimeAgo(a.createdAt)}</span>
                </div>
              </li>
            );
          })
        )}
      </ol>
    </div>
  );
};
