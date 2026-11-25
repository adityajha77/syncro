import React, { useState } from 'react';
import { GitCommit, CheckCircle2, Calendar, Sparkles } from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'commit' | 'task' | 'calendar';
  title: string;
  subtitle: string;
  author: string;
  timestamp: string;
  badge?: string;
  badgeColor?: string;
}

interface ActivityTimelineStreamProps {
  customActivities?: ActivityItem[];
}

export const ActivityTimelineStream: React.FC<ActivityTimelineStreamProps> = ({
  customActivities
}) => {
  const [filter, setFilter] = useState<'all' | 'commit' | 'task' | 'calendar'>('all');

  const defaultActivities: ActivityItem[] = [
    {
      id: 'act-1',
      type: 'commit',
      title: 'chore(frontend): verify clean production build and dependencies',
      subtitle: 'Commit 4199987 pushed to origin/main with 0 errors',
      author: 'Rsinchana16',
      timestamp: 'Just now',
      badge: 'Git Stream',
      badgeColor: 'border-purple-500/30 text-purple-400 bg-purple-500/10'
    },
    {
      id: 'act-2',
      type: 'task',
      title: 'Completed: Unified Workspace Cockpit Dashboard',
      subtitle: 'Moved task from IN PROGRESS to DONE (Priority: URGENT)',
      author: 'Sinchana R.',
      timestamp: '2 hours ago',
      badge: 'Task Deliverable',
      badgeColor: 'border-blue-500/30 text-blue-400 bg-blue-500/10'
    },
    {
      id: 'act-3',
      type: 'calendar',
      title: 'Scheduled: Sprint Retrospective & Mentor Review',
      subtitle: 'Time: 4:00 PM - 5:00 PM via Google Meet',
      author: 'Sprint Calendar',
      timestamp: 'Today',
      badge: 'Sprint Event',
      badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
    },
    {
      id: 'act-4',
      type: 'commit',
      title: 'feat: real backend, auth, invites, profile, GitHub + Google integrations',
      subtitle: 'Commit 94e264e merged into main branch',
      author: 'adityajha77',
      timestamp: '2 weeks ago',
      badge: 'Git Stream',
      badgeColor: 'border-purple-500/30 text-purple-400 bg-purple-500/10'
    },
    {
      id: 'act-5',
      type: 'task',
      title: 'In Progress: Real-time WebSocket State Binding',
      subtitle: 'WebSocket gateway initialized on /ws protocol',
      author: 'Aditya Jha',
      timestamp: '2 weeks ago',
      badge: 'Realtime Backend',
      badgeColor: 'border-blue-500/30 text-blue-400 bg-blue-500/10'
    },
    {
      id: 'act-6',
      type: 'calendar',
      title: 'Completed: Daily Engineering Standup',
      subtitle: 'Reviewed blockers and task distribution across monorepo',
      author: 'Sprint Calendar',
      timestamp: 'Yesterday',
      badge: 'Sprint Event',
      badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
    }
  ];

  const activities = customActivities && customActivities.length > 0 ? customActivities : defaultActivities;

  const filtered = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter);

  return (
    <div className="w-full bg-[#0a0c12] border border-zinc-800 rounded-2xl p-6 text-zinc-100 shadow-xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-zinc-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">
              Unified Activity Timeline Stream
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Feed
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Aggregated audit ledger of repository commits, deliverable updates, and calendar milestones.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-zinc-700 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            All ({activities.length})
          </button>
          <button
            onClick={() => setFilter('commit')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filter === 'commit'
                ? 'bg-purple-600/40 text-purple-200 border border-purple-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Commits
          </button>
          <button
            onClick={() => setFilter('task')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filter === 'task'
                ? 'bg-blue-600/40 text-blue-200 border border-blue-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setFilter('calendar')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filter === 'calendar'
                ? 'bg-emerald-600/40 text-emerald-200 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pt-6">
        <div className="absolute left-[19px] top-9 bottom-4 w-0.5 bg-zinc-800" />

        <div className="space-y-6">
          {filtered.map((item) => {
            const isCommit = item.type === 'commit';
            const isTask = item.type === 'task';

            return (
              <div key={item.id} className="relative flex items-start gap-4 group">
                <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-transform group-hover:scale-105 border ${
                  isCommit 
                    ? 'bg-purple-950/40 border-purple-500/30 text-purple-400 shadow-sm shadow-purple-500/10'
                    : isTask
                    ? 'bg-blue-950/40 border-blue-500/30 text-blue-400 shadow-sm shadow-blue-500/10'
                    : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/10'
                }`}>
                  {isCommit && <GitCommit className="w-4 h-4" />}
                  {isTask && <CheckCircle2 className="w-4 h-4" />}
                  {!isCommit && !isTask && <Calendar className="w-4 h-4" />}
                </div>

                <div className="flex-1 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-white leading-snug">
                      {item.title}
                    </span>
                    {item.badge && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-medium shrink-0 ${item.badgeColor || 'border-zinc-700 text-zinc-300'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 mb-2">
                    {item.subtitle}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1.5 border-t border-zinc-800/50">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                      By <strong className="text-zinc-200 font-medium">{item.author}</strong>
                    </span>
                    <span className="font-mono text-zinc-500 text-[10px]">{item.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
