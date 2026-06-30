import type { TaskMessage } from '../types';
import { API_BASE, apiFetch } from './client';

export function fetchTaskMessages (taskId: number): Promise<TaskMessage[]> {
  return apiFetch<TaskMessage[]>(`${API_BASE}/tasks/${taskId}/chat`);
}

export async function postTaskMessage (
  taskId: number,
  data: { sender: string; content: string; signature: string; file?: File },
): Promise<TaskMessage> {
  const form: FormData = new FormData();
  form.append('sender', data.sender);
  form.append('content', data.content);
  form.append('signature', data.signature);

  if (data.file) {
    form.append('file', data.file);
  }

  return apiFetch<TaskMessage>(`${API_BASE}/tasks/${taskId}/chat`, {
    method: 'POST',
    body: form,
  });
}
