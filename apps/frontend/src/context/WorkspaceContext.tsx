import { createContext, useContext } from 'react';
import type { IntegrationStatus, Meeting, Member, PresenceEntry, Task, TimeEntry, User, Workspace } from '../types';

/**
 * Live workspace state shared by the Overview, Board, Team, Time and Meetings views.
 * WorkspaceApp owns the data (REST + WebSocket); views read and mutate through this.
 */
export interface WorkspaceCtx {
  workspace: Workspace;
  workspaceId: string;
  user: User;
  canWrite: boolean;
  /** First load of the workspace data is still in flight. */
  loading: boolean;
  isAdmin: boolean;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  members: Member[];
  presence: PresenceEntry[];
  /** Everyone currently on the clock in this workspace. */
  activeTimers: TimeEntry[];
  myTimer: TimeEntry | null;
  startTimer: (taskId?: string | null, note?: string) => Promise<void>;
  stopTimer: () => Promise<void>;
  meetings: Meeting[];
  setMeetings: React.Dispatch<React.SetStateAction<Meeting[]>>;
  integrations: IntegrationStatus[];
  openTask: (taskId: string) => void;
  fail: (err: unknown) => void;
  toast: (kind: 'success' | 'error', message: string) => void;
  /** Bumped whenever comments/checklists change for a task (drawer refetch). */
  detailVersion: Record<string, number>;
  /** Bumped on any time-tracking or task event (team / timesheet refetch). */
  pulseVersion: number;
}

export const WorkspaceContext = createContext<WorkspaceCtx | null>(null);

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceApp');
  return ctx;
};
