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
  Member,
  Task,
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
    payload: { title: string; description?: string; priority?: TaskPriority; dueDate?: string | null; label?: string }
  ) => request<Task>(`/workspaces/${ws}/tasks`, json('POST', payload)),
  updateTask: (
    ws: string,
    taskId: string,
    patch: Partial<{ title: string; description: string; status: TaskStatus; priority: TaskPriority; dueDate: string | null; assigneeId: string | null }>
  ) => request<Task>(`/workspaces/${ws}/tasks/${taskId}`, json('PATCH', patch)),
  deleteTask: (ws: string, taskId: string) => request<{ id: string }>(`/workspaces/${ws}/tasks/${taskId}`, json('DELETE')),

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
