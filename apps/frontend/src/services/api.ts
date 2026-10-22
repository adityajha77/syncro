import { HealthMetrics, Task, ActivityRecord } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export async function fetchHealth(): Promise<HealthMetrics> {
  const res = await fetch(`${API_BASE_URL}/api/v1/health`);
  if (!res.ok) {
    throw new Error(`Failed to fetch health: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchTasks(): Promise<{ data: Task[]; source: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/tasks`);
  if (!res.ok) {
    throw new Error(`Failed to fetch tasks: ${res.statusText}`);
  }
  return res.json();
}

export async function createTask(payload: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
}): Promise<{ data: Task }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to create task: ${res.statusText}`);
  }
  return res.json();
}

export async function updateTaskStatus(id: string, status: string): Promise<{ data: Task }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update task: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchActivities(): Promise<{ data: ActivityRecord[]; source: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/activities`);
  if (!res.ok) {
    throw new Error(`Failed to fetch activities: ${res.statusText}`);
  }
  return res.json();
}

export async function recordActivity(payload: {
  type: string;
  description: string;
}): Promise<{ data: ActivityRecord }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to record activity: ${res.statusText}`);
  }
  return res.json();
}
