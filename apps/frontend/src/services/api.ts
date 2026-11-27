import type {
  ActivityRecord,
  CalendarEvent,
  Commit,
  EventCategory,
  GithubRepo,
  GoogleEvent,
  HealthMetrics,
  IntegrationKey,
  IntegrationStatus,
  Meeting,
  MeetingProvider,
  Member,
  ChecklistItem,
  Task,
  TaskComment,
  TaskDetail,
  TeamMemberPulse,
  TimeEntry,
  TaskPriority,
  TaskStatus,
  Telemetry,
  User,
  Workspace,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const TOKEN_KEY = 'syncro.token';

// ---------- token storage ----------
export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable — session lasts until reload */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the Syncro server. Is the backend running?');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Surface the first field-level validation message when available.
    const fieldErrors = body?.details?.fieldErrors as Record<string, string[]> | undefined;
    const firstField = fieldErrors && Object.values(fieldErrors).flat()[0];
    throw new ApiError(res.status, firstField || body?.error || res.statusText, body?.details);
  }
  return body.data as T;
}

const json = (method: string, data?: unknown): RequestInit => ({
  method,
  body: data === undefined ? undefined : JSON.stringify(data),
});

// ---------- auth ----------
export interface AuthResult {
  token: string;
  user: User;
}

export const api = {
  health: () => fetch(`${API_BASE_URL}/api/v1/health`).then((r) => r.json() as Promise<HealthMetrics>),

  signup: (payload: { name: string; email: string; password: string }) =>
    request<AuthResult & { workspaces: Workspace[] }>('/auth/signup', json('POST', payload)),
  login: (payload: { email: string; password: string }) => request<AuthResult>('/auth/login', json('POST', payload)),
  demoAvailable: () => request<{ available: boolean }>('/auth/demo'),
  demoLogin: () => request<AuthResult & { workspaces: Workspace[] }>('/auth/demo', json('POST')),
  me: () => request<{ user: User; workspaces: Workspace[] }>('/auth/me'),
  updateProfile: (patch: { name: string }) => request<User>('/auth/me', json('PATCH', patch)),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request<{ changed: boolean }>('/auth/change-password', json('POST', payload)),

  // ---------- workspaces ----------
  createWorkspace: (name: string) => request<Workspace>('/workspaces', json('POST', { name })),
  joinWorkspace: (code: string) => request<Workspace>('/workspaces/join', json('POST', { code })),
  leaveWorkspace: (id: string) => request<{ workspaceId: string }>(`/workspaces/${id}/membership`, json('DELETE')),
  regenerateInviteCode: (id: string) => request<Workspace>(`/workspaces/${id}/invite-code`, json('POST')),
  updateWorkspace: (id: string, patch: Partial<Pick<Workspace, 'name' | 'repoFullName' | 'defaultBranch'>>) =>
    request<Workspace>(`/workspaces/${id}`, json('PATCH', patch)),
  members: (id: string) => request<Member[]>(`/workspaces/${id}/members`),
  addMember: (id: string, email: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER' = 'MEMBER') =>
    request<Member>(`/workspaces/${id}/members`, json('POST', { email, role })),
  activities: (id: string, limit = 50) => request<ActivityRecord[]>(`/workspaces/${id}/activities?limit=${limit}`),
  telemetry: (id: string) => request<Telemetry>(`/workspaces/${id}/telemetry`),

  // ---------- tasks ----------
  tasks: (ws: string) => request<Task[]>(`/workspaces/${ws}/tasks`),
  createTask: (
    ws: string,
    payload: {
      title: string;
      description?: string;
      priority?: TaskPriority;
      dueDate?: string | null;
      label?: string;
      status?: TaskStatus;
      assigneeId?: string | null;
      estimateMinutes?: number | null;
    }
  ) => request<Task>(`/workspaces/${ws}/tasks`, json('POST', payload)),
  updateTask: (
    ws: string,
    taskId: string,
    patch: Partial<{
      title: string;
      description: string;
      status: TaskStatus;
      priority: TaskPriority;
      dueDate: string | null;
      assigneeId: string | null;
      label: string;
      estimateMinutes: number | null;
    }>
  ) => request<Task>(`/workspaces/${ws}/tasks/${taskId}`, json('PATCH', patch)),
  deleteTask: (ws: string, taskId: string) => request<{ id: string }>(`/workspaces/${ws}/tasks/${taskId}`, json('DELETE')),
  moveTask: (ws: string, taskId: string, status: TaskStatus, index: number) =>
    request<Task>(`/workspaces/${ws}/tasks/${taskId}/move`, json('POST', { status, index })),
  taskDetail: (ws: string, taskId: string) => request<TaskDetail>(`/workspaces/${ws}/tasks/${taskId}`),
  addChecklistItem: (ws: string, taskId: string, text: string) =>
    request<ChecklistItem>(`/workspaces/${ws}/tasks/${taskId}/checklist`, json('POST', { text })),
  updateChecklistItem: (ws: string, taskId: string, itemId: string, patch: { text?: string; done?: boolean }) =>
    request<ChecklistItem>(`/workspaces/${ws}/tasks/${taskId}/checklist/${itemId}`, json('PATCH', patch)),
  deleteChecklistItem: (ws: string, taskId: string, itemId: string) =>
    request<{ id: string }>(`/workspaces/${ws}/tasks/${taskId}/checklist/${itemId}`, json('DELETE')),
  addComment: (ws: string, taskId: string, body: string) =>
    request<TaskComment>(`/workspaces/${ws}/tasks/${taskId}/comments`, json('POST', { body })),
  deleteComment: (ws: string, taskId: string, commentId: string) =>
    request<{ id: string }>(`/workspaces/${ws}/tasks/${taskId}/comments/${commentId}`, json('DELETE')),

  // ---------- time tracking ----------
  activeTimers: (ws: string) => request<TimeEntry[]>(`/workspaces/${ws}/time/active`),
  startTimer: (ws: string, payload: { taskId?: string | null; note?: string }) =>
    request<TimeEntry>(`/workspaces/${ws}/time/start`, json('POST', payload)),
  stopTimer: (ws: string) => request<TimeEntry | null>(`/workspaces/${ws}/time/stop`, json('POST')),
  timeEntries: (ws: string, range: { from: string; to: string; userId?: string }) =>
    request<TimeEntry[]>(`/workspaces/${ws}/time/entries?${new URLSearchParams(range as Record<string, string>)}`),
  logTime: (ws: string, payload: { taskId?: string | null; startedAt: string; minutes: number; note?: string }) =>
    request<TimeEntry>(`/workspaces/${ws}/time/entries`, json('POST', payload)),
  deleteTimeEntry: (ws: string, id: string) => request<{ id: string }>(`/workspaces/${ws}/time/entries/${id}`, json('DELETE')),
  team: (ws: string, range: { dayStart: string; weekStart: string }) =>
    request<{ generatedAt: string; members: TeamMemberPulse[] }>(`/workspaces/${ws}/telemetry/team?${new URLSearchParams(range)}`),

  // ---------- meetings ----------
  meetings: (ws: string) => request<Meeting[]>(`/workspaces/${ws}/meetings`),
  createMeeting: (
    ws: string,
    payload: { title: string; provider: MeetingProvider; startsAt?: string; durationMinutes?: number; taskId?: string | null; inviteMembers?: boolean }
  ) => request<Meeting>(`/workspaces/${ws}/meetings`, json('POST', payload)),
  deleteMeeting: (ws: string, id: string) => request<{ id: string }>(`/workspaces/${ws}/meetings/${id}`, json('DELETE')),

  // ---------- commits ----------
  commits: (ws: string) => request<Commit[]>(`/workspaces/${ws}/commits`),
  createCommit: (ws: string, payload: { message: string; branch?: string }) =>
    request<Commit>(`/workspaces/${ws}/commits`, json('POST', payload)),
  syncCommits: (ws: string) =>
    request<{ added: number; fetched: number; syncedAt: string }>(`/workspaces/${ws}/commits/sync`, json('POST')),

  // ---------- calendar ----------
  events: (ws: string, range?: { from: string; to: string }) =>
    request<CalendarEvent[]>(
      `/workspaces/${ws}/events${range ? `?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}` : ''}`
    ),
  createEvent: (
    ws: string,
    payload: { title: string; startsAt: string; category: EventCategory; location?: string; durationMinutes?: number; addToGoogle?: boolean }
  ) =>
    request<CalendarEvent>(`/workspaces/${ws}/events`, json('POST', payload)),
  deleteEvent: (ws: string, eventId: string) => request<{ id: string }>(`/workspaces/${ws}/events/${eventId}`, json('DELETE')),

  // ---------- integrations ----------
  integrations: () => request<IntegrationStatus[]>('/integrations'),
  connectUrl: (p: IntegrationKey) => request<{ url: string }>(`/integrations/${p}/connect`),
  disconnectIntegration: (p: IntegrationKey) => request<{ provider: IntegrationKey }>(`/integrations/${p}`, json('DELETE')),
  githubRepos: () => request<GithubRepo[]>('/integrations/github/repos'),
  googleEvents: (range: { from: string; to: string }) =>
    request<GoogleEvent[]>(`/integrations/google/events?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`),
};
