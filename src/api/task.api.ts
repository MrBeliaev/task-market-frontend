import type {
  TaskResponse,
  PaginatedResponse,
  Application,
  Comment,
} from '../types';
import { API_BASE, apiFetch } from './client';

export function fetchTasks (params?: Record<string, string>): Promise<PaginatedResponse> {
  const query: string = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<PaginatedResponse>(`${API_BASE}/tasks${query}`);
}

export function fetchTask (id: number): Promise<TaskResponse> {
  return apiFetch<TaskResponse>(`${API_BASE}/tasks/${id}`);
}

export function createTaskMetadata (data: {
  onChainId: number;
  chainId: number;
  client: string;
  signature: string;
  reward: string;
  deadline: string;
  metadataHash: string;
  title: string;
  description: string;
  contactInfo: string;
  referenceLink?: string;
  category?: string;
  skills?: string[];
}): Promise<TaskResponse> {
  return apiFetch<TaskResponse>(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function applyToTask (
  taskId: number,
  data: { applicant: string; message: string; signature: string },
): Promise<Application> {
  return apiFetch<Application>(`${API_BASE}/tasks/${taskId}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function addComment (
  taskId: number,
  data: { author: string; content: string; signature: string },
): Promise<Comment> {
  return apiFetch<Comment>(`${API_BASE}/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
