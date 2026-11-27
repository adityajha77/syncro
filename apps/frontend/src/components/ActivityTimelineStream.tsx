import React, { useState } from 'react';
import { IconTile } from './ui';
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
  /** Taller list for the dedicated Activity tab. */
  tall?: boolean;
  activities?: ActivityItem[];
  activityDot?: any;
  icon?: any;
}

export const ActivityTimelineStream: React.FC<ActivityTimelineStreamProps> = ({
  activities = [],
  tall = false,
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
    if (filter === 'task') return t.includes('task') || t.includes('timer') || t.includes('time_') || t.includes('comment') || t.includes('checklist');
    if (filter === 'calendar') return t.includes('calendar') || t.includes('event') || t.includes('meeting');
    if (filter === 'commit') return t.includes('commit') || s.includes('commit') || s.includes('push');
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header with Title and Filter Tabs */}
      <div className="flex flex-col gap-3 pb-5 border-b border-black/10 mb-5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <IconTile tone="sky">{icon || <Activity className="h-5 w-5" />}</IconTile>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-hand text-[1.7rem] font-bold leading-tight text-black dark:text-zinc-100">
                Unified Activity Timeline Stream
              </h3>
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 font-medium dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Feed
              </span>
            </div>
            <p className="text-sm text-zinc-500 mt-0.5 dark:text-zinc-400">
              Everything that happened, in one filtered chronological timeline
            </p>
          </div>
        </div>

        {/* Filter Pills matching Jet Black theme */}
        <div className="flex items-center gap-1 bg-zinc-100 border border-black/10 p-1 rounded-xl dark:bg-black/60 dark:border-white/10 self-start sm:self-auto">
          {(['all', 'task', 'calendar', 'commit'] as const).map(tab => {
            const count = tab === 'all' 
              ? activities.length 
              : activities.filter(a => {
                  const s = (a.summary || '').toLowerCase();
                  const t = (a.type || '').toLowerCase();
                  if (tab === 'task') return t.includes('task') || t.includes('timer') || t.includes('time_') || t.includes('comment') || t.includes('checklist');
                  if (tab === 'calendar') return t.includes('calendar') || t.includes('event') || t.includes('meeting');
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
                    ? 'bg-white text-black shadow-sm border border-black/10 dark:bg-white/15 dark:text-white dark:border-white/20'
                    : 'text-zinc-500 hover:text-black hover:bg-black/5 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-white/5'
                }`}
              >
                {labels[tab]} {count > 0 && <span className="text-[10px] text-zinc-400 ml-0.5">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline Stream using exact Jet Black styling */}
      <ol className={`relative -mr-2 flex-1 overflow-y-auto pr-2 ${tall ? 'max-h-[calc(100vh-17rem)]' : 'max-h-[26rem]'}`}>
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
                  <span className="absolute left-[15px] top-9 h-[calc(100%-2rem)] w-px bg-black/10 dark:bg-white/10" />
                )}
                <div className="relative shrink-0">
                  <div className="h-8 w-8 rounded-full bg-zinc-100 border border-black/10 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:bg-white/5 dark:border-white/10 dark:text-zinc-200">
                    {a.actor?.name?.slice(0, 2).toUpperCase() || 'SR'}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-black ${dotColor}`} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="break-words text-sm leading-snug text-zinc-600 dark:text-zinc-300">
                    <span className="font-semibold text-black dark:text-zinc-100">{a.actor?.name}</span> {a.summary}
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
