export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ActivityType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_COMPLETED'
  | 'TASK_DELETED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'EVENT_SCHEDULED'
  | 'USER_JOINED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  projectId: string;
  assigneeId?: string | null;
  assignee?: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityRecord {
  id: string;
  type: ActivityType;
  description: string;
  projectId: string;
  userId: string;
  userName?: string;
  user?: User;
  createdAt: string;
}

export interface HealthMetrics {
  status: string;
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  realtime: {
    connectedClients: number;
    protocol: string;
    endpoint: string;
  };
  database: {
    status: string;
    latencyMs: number | null;
  };
  system: {
    nodeVersion: string;
    memoryUsageMb: number;
  };
}

export interface WSMessage<T = unknown> {
  event: string;
  data: T;
  timestamp: string;
}
