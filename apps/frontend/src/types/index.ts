// Shared domain types — mirror apps/backend/prisma/schema.prisma

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
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
  | 'COMMITS_SYNCED';

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
  workspaceId: string;
  assigneeId: string | null;
  assignee: User | null;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
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

export type IntegrationKey = 'github' | 'google';

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
