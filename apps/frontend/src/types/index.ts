// Shared domain types — mirror apps/backend/prisma/schema.prisma

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type EventCategory = 'STANDUP' | 'REVIEW' | 'DEADLINE' | 'SYNC';

export type ActivityType =
  | 'WORKSPACE_CREATED'
  | 'MEMBER_JOINED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_COMPLETED'
  | 'TASK_DELETED'
  | 'COMMIT_PUSHED'
  | 'EVENT_SCHEDULED'
  | 'EVENT_DELETED'
  | 'REPO_CONNECTED'
  | 'MEMBER_LEFT'
  | 'COMMITS_SYNCED'
  | 'TIMER_STARTED'
  | 'TIMER_STOPPED'
  | 'TIME_LOGGED'
  | 'COMMENT_ADDED'
  | 'CHECKLIST_UPDATED'
  | 'MEETING_SCHEDULED'
  | 'MEETING_STARTED';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  repoFullName: string | null;
  defaultBranch: string;
  inviteCode: string | null; // null for viewers
  githubSyncedAt: string | null;
  memberCount: number;
  role: Role;
  createdAt: string;
}

export interface Member extends User {
  role: Role;
  joinedAt: string;
  online: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  label: string | null;
  completedAt: string | null;
  position: number;
  estimateMinutes: number | null;
  workspaceId: string;
  assigneeId: string | null;
  assignee: User | null;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  checklistTotal: number;
  checklistDone: number;
  commentCount: number;
  /** Seconds from finished time entries; add a running timer's elapsed time on top. */
  trackedSeconds: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  position: number;
}

export interface TaskComment {
  id: string;
  body: string;
  author: User;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  startedAt: string;
  endedAt: string | null;
  note: string | null;
  manual: boolean;
  userId: string;
  user: User;
  workspaceId: string;
  taskId: string | null;
  task: { id: string; title: string; status: TaskStatus } | null;
}

export type MeetingProvider = 'INSTANT' | 'GOOGLE_MEET' | 'ZOOM';

export interface Meeting {
  id: string;
  title: string;
  provider: MeetingProvider;
  joinUrl: string;
  startsAt: string;
  durationMinutes: number;
  taskId: string | null;
  task: { id: string; title: string } | null;
  createdBy: User;
  createdAt: string;
}

export interface TaskDetail extends Task {
  checklist: ChecklistItem[];
  comments: TaskComment[];
  timeEntries: TimeEntry[];
  meetings: Meeting[];
}

type MiniTask = { id: string; title: string; priority: TaskPriority };

export interface TeamMemberPulse {
  user: User;
  role: Role;
  online: boolean;
  activeTimer: { id: string; startedAt: string; note: string | null; task: { id: string; title: string; status: TaskStatus } | null } | null;
  todaySeconds: number;
  weekSeconds: number;
  counts: { todo: number; inProgress: number; review: number; doneToday: number; overdue: number };
  standup: { done: MiniTask[]; doing: MiniTask[]; next: MiniTask[]; blockers: MiniTask[]; trackedSeconds24h: number; commits24h: number };
}

export interface Commit {
  id: string;
  sha: string;
  message: string;
  branch: string;
  source: 'MANUAL' | 'GITHUB';
  url: string | null;
  authorName: string;
  authorLogin: string | null;
  author: User | null;
  committedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  category: EventCategory;
  location: string | null;
  googleEventId: string | null;
  createdBy: User;
}

export type IntegrationKey = 'github' | 'google' | 'zoom';

export interface IntegrationStatus {
  provider: IntegrationKey;
  configured: boolean;
  connected: boolean;
  /** Connected but missing required permissions (e.g. Calendar box unticked) */
  needsReconnect: boolean;
  accountLabel: string | null;
  connectedAt: string | null;
}

export interface GithubRepo {
  fullName: string;
  private: boolean;
  defaultBranch: string;
  pushedAt: string;
  description: string | null;
}

export interface GoogleEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  location: string | null;
  htmlLink: string;
}

export interface ActivityRecord {
  id: string;
  type: ActivityType;
  summary: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  actor: User;
  createdAt: string;
}

export interface Telemetry {
  tasks: { total: number; todo: number; inProgress: number; done: number; overdue: number; completedLast24h: number };
  completionRate: number;
  healthScore: number;
  commitsLast24h: number;
  activityLast24h: number;
  onlineMembers: number;
  dbLatencyMs: number;
  generatedAt: string;
}

export interface PresenceEntry {
  userId: string;
  name: string;
  connections: number;
  viewing: string | null;
  typing: boolean;
  lastSeenAt: string;
}

export interface HealthMetrics {
  status: string;
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  realtime: { connectedClients: number; protocol: string; endpoint: string };
  database: { status: string; latencyMs: number | null };
  system: { nodeVersion: string; memoryUsageMb: number };
}

export interface WSMessage<T = unknown> {
  event: string;
  data: T;
  timestamp: string;
}
