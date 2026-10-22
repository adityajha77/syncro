import React, { useState } from 'react';
import { CheckCircle2, Clock, Plus, Sparkles, Filter } from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { createTask, updateTaskStatus } from '../services/api';

interface DailySummaryProps {
  tasks: Task[];
  onTaskChange?: () => void;
}

export const DailySummary: React.FC<DailySummaryProps> = ({ tasks, onTaskChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('MEDIUM');
  const [filter, setFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [submitting, setSubmitting] = useState(false);

  const doneCount = tasks.filter((t) => t.status === 'DONE').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const todoCount = tasks.filter((t) => t.status === 'TODO').length;
  const total = tasks.length;
  const progressPercent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setSubmitting(true);
      await createTask({
        title: newTitle.trim(),
        priority: newPriority,
        status: 'TODO',
      });
      setNewTitle('');
      setIsModalOpen(false);
      if (onTaskChange) onTaskChange();
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (taskId: string, currentStatus: TaskStatus) => {
    const nextStatus: TaskStatus =
      currentStatus === 'TODO' ? 'IN_PROGRESS' : currentStatus === 'IN_PROGRESS' ? 'DONE' : 'TODO';
    try {
      await updateTaskStatus(taskId, nextStatus);
      if (onTaskChange) onTaskChange();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filteredTasks = filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> Daily Work Summary
          </h2>
          <p className="text-xs text-slate-400">Team execution velocity and sprint checklist</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" /> New Task
        </button>
      </div>

      {/* Progress Bar Card */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-5">
        <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-2">
          <span>Sprint Completion</span>
          <span className="text-indigo-400 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Counter Pills */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/60 text-center">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="block text-emerald-400 text-lg font-bold">{doneCount}</span>
            <span className="text-[11px] text-emerald-300/80 uppercase tracking-wider font-semibold">Done</span>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="block text-amber-400 text-lg font-bold">{inProgressCount}</span>
            <span className="text-[11px] text-amber-300/80 uppercase tracking-wider font-semibold">Active</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <span className="block text-slate-300 text-lg font-bold">{todoCount}</span>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Pending</span>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 mb-3 text-xs">
        <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
        {(['ALL', 'TODO', 'IN_PROGRESS', 'DONE'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              filter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[360px]">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">No tasks in this view</div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="group p-3 rounded-xl bg-slate-950/40 hover:bg-slate-800/40 border border-slate-800/60 hover:border-slate-700/80 transition-all flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  onClick={() => handleStatusToggle(task.id, task.status)}
                  className="mt-0.5 text-slate-400 hover:text-indigo-400 transition-colors"
                  title="Click to cycle status (TODO -> IN_PROGRESS -> DONE)"
                >
                  {task.status === 'DONE' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
                  ) : task.status === 'IN_PROGRESS' ? (
                    <Clock className="w-4 h-4 text-amber-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-600 group-hover:border-indigo-400" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-sm font-medium truncate ${
                      task.status === 'DONE' ? 'text-slate-500 line-through' : 'text-slate-200'
                    }`}
                  >
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">{task.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    task.priority === 'URGENT'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : task.priority === 'HIGH'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Task Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-100 mb-4">Create New Workspace Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement real-time notifications"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
