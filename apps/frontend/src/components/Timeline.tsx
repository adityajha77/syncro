import React, { useState } from 'react';
import { History, GitCommit, UserCheck, Calendar, CheckSquare, Send } from 'lucide-react';
import { ActivityRecord, ActivityType } from '../types';
import { recordActivity } from '../services/api';

interface TimelineProps {
  activities: ActivityRecord[];
  onActivityRecorded?: () => void;
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'TASK_CREATED':
    case 'TASK_UPDATED':
      return <CheckSquare className="w-4 h-4 text-indigo-400" />;
    case 'TASK_COMPLETED':
      return <CheckSquare className="w-4 h-4 text-emerald-400" />;
    case 'PROJECT_CREATED':
    case 'PROJECT_UPDATED':
      return <GitCommit className="w-4 h-4 text-purple-400" />;
    case 'EVENT_SCHEDULED':
      return <Calendar className="w-4 h-4 text-amber-400" />;
    case 'USER_JOINED':
      return <UserCheck className="w-4 h-4 text-sky-400" />;
    default:
      return <History className="w-4 h-4 text-slate-400" />;
  }
};

const formatTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  } catch {
    return 'recently';
  }
};

export const Timeline: React.FC<TimelineProps> = ({ activities, onActivityRecorded }) => {
  const [quickText, setQuickText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePostActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim()) return;

    try {
      setSubmitting(true);
      await recordActivity({
        type: 'PROJECT_UPDATED',
        description: quickText.trim(),
      });
      setQuickText('');
      if (onActivityRecorded) onActivityRecorded();
    } catch (err) {
      console.error('Failed to post activity:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Unified Activity Timeline</h2>
            <p className="text-xs text-slate-400">Continuous feed of team movements and automated events</p>
          </div>
        </div>
      </div>

      {/* Quick broadcast input */}
      <form onSubmit={handlePostActivity} className="mb-5 flex gap-2">
        <input
          type="text"
          placeholder="Log workspace update or note..."
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          className="flex-1 px-3.5 py-2 text-xs bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
        <button
          type="submit"
          disabled={submitting || !quickText.trim()}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          Log
        </button>
      </form>

      {/* Activity Timeline Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[460px]">
        {activities.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">No activity logged yet</div>
        ) : (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800/80">
            {activities.map((act) => (
              <div key={act.id} className="relative group">
                {/* Dot / Icon marker */}
                <div className="absolute -left-6 top-0.5 p-1 rounded-full bg-slate-950 border border-slate-800 group-hover:border-purple-500/50 transition-colors">
                  {getActivityIcon(act.type)}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/30 border border-slate-800/60 hover:border-slate-700/60 transition-all">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-semibold text-slate-200">
                      {act.userName || act.user?.name || 'Workspace Member'}
                    </span>
                    <span className="text-[11px] text-slate-500">{formatTime(act.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{act.description}</p>
                  <div className="mt-2">
                    <span className="inline-block px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase rounded bg-slate-800 text-slate-400">
                      {act.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
