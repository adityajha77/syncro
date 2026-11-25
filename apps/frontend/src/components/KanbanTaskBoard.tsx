import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import type { Task } from '../types';

interface KanbanTaskBoardProps {
  tasks: Task[];
  updateStatus: (taskId: string, newStatus: any) => Promise<void> | void;
  canWrite: boolean;
}

const COLUMNS: Array<{ id: 'TODO' | 'IN_PROGRESS' | 'DONE'; label: string; dot: string; border: string }> = [
  { id: 'TODO', label: 'To Do', dot: 'bg-zinc-400', border: 'border-white/10' },
  { id: 'IN_PROGRESS', label: 'In Progress', dot: 'bg-amber-400', border: 'border-amber-500/20' },
  { id: 'DONE', label: 'Done', dot: 'bg-emerald-400', border: 'border-emerald-500/20' },
];

const PRIORITY_BADGES: Record<string, string> = {
  LOW: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  URGENT: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export const KanbanTaskBoard: React.FC<KanbanTaskBoardProps> = ({ tasks, updateStatus, canWrite }) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    e.preventDefault();
    const taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
    if (taskId) {
      updateStatus(taskId, targetStatus);
      setDraggedTaskId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-2xl border ${col.border} bg-black/40 p-3.5 min-h-[22rem] transition-colors`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  {col.label}
                </h4>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                {colTasks.length}
              </span>
            </div>

            {/* Column Task Cards */}
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[36rem] pr-1">
              {colTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-600 border border-dashed border-white/5 rounded-xl">
                  Drop tasks here
                </div>
              ) : (
                colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable={canWrite}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="group relative flex flex-col gap-2 rounded-xl border border-white/10 bg-zinc-900/60 p-3 hover:border-white/20 hover:bg-zinc-900/90 transition-all cursor-grab active:cursor-grabbing shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-zinc-100 group-hover:text-white leading-snug">
                        {task.title}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium shrink-0 ${
                          PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.MEDIUM
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Metadata & Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        {task.label && (
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-[11px] text-zinc-300">
                            {task.label}
                          </span>
                        )}
                        {task.assignee?.name && (
                          <span className="text-[11px] text-zinc-400 truncate max-w-[80px]">
                            {task.assignee.name}
                          </span>
                        )}
                      </div>

                      {/* Quick Move Buttons */}
                      {canWrite && (
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          {col.id === 'TODO' && (
                            <button
                              onClick={() => updateStatus(task.id, 'IN_PROGRESS')}
                              title="Start task (Move to In Progress)"
                              className="p-1 rounded-lg hover:bg-amber-500/20 text-zinc-400 hover:text-amber-400 transition"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {col.id === 'IN_PROGRESS' && (
                            <>
                              <button
                                onClick={() => updateStatus(task.id, 'TODO')}
                                title="Move back to To Do"
                                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => updateStatus(task.id, 'DONE')}
                                title="Mark as Done"
                                className="p-1 rounded-lg hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400 transition"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          {col.id === 'DONE' && (
                            <button
                              onClick={() => updateStatus(task.id, 'IN_PROGRESS')}
                              title="Reopen task"
                              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
