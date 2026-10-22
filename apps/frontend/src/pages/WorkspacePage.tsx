import React, { useEffect, useState, useCallback } from 'react';
import { HealthDashboard } from '../components/HealthDashboard';
import { DailySummary } from '../components/DailySummary';
import { Timeline } from '../components/Timeline';
import { fetchTasks, fetchActivities } from '../services/api';
import { Task, ActivityRecord, WSMessage } from '../types';

interface WorkspacePageProps {
  lastMessage: WSMessage | null;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ lastMessage }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      const [tasksRes, activitiesRes] = await Promise.all([fetchTasks(), fetchActivities()]);
      setTasks(tasksRes.data);
      setActivities(activitiesRes.data);
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reactively respond to incoming WebSocket events
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.event === 'TASK_CREATED') {
      const newTask = lastMessage.data as Task;
      setTasks((prev) => [newTask, ...prev.filter((t) => t.id !== newTask.id)]);
    } else if (lastMessage.event === 'TASK_UPDATED') {
      const updated = lastMessage.data as Task;
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } else if (lastMessage.event === 'ACTIVITY_RECORDED') {
      const newAct = lastMessage.data as ActivityRecord;
      setActivities((prev) => [newAct, ...prev.filter((a) => a.id !== newAct.id)]);
    }
  }, [lastMessage]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Hero Info */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 border border-indigo-500/20 p-8 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              ✨ Production-Ready Monorepo Architecture
            </span>
            {loading && (
              <span className="text-[11px] text-indigo-300/80 animate-pulse">Syncing initial state...</span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Syncro Connected Workspace
          </h1>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            Integrated multi-package system powered by Node.js, Express, PostgreSQL, Prisma ORM, WebSockets,
            and React Vite with Tailwind CSS. Real-time synchronizations propagate across clients instantly.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Health Dashboard (Full Width) */}
      <section>
        <HealthDashboard />
      </section>

      {/* Dual Column: Daily Summary & Activity Timeline */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <DailySummary tasks={tasks} onTaskChange={loadData} />
        <Timeline activities={activities} onActivityRecorded={loadData} />
      </section>
    </main>
  );
};
