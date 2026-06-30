import type { DisputeMessage } from '../types';
import { API_BASE, apiFetch } from './client';

export function fetchDisputeMessages (taskId: number): Promise<DisputeMessage[]> {
  return apiFetch<DisputeMessage[]>(`${API_BASE}/tasks/${taskId}/dispute`);
}

export async function postDisputeMessage (
  taskId: number,
  data: { sender: string; content: string; signature: string; file?: File },
): Promise<DisputeMessage> {
  const form: FormData = new FormData();
  form.append('sender', data.sender);
  form.append('content', data.content);
  form.append('signature', data.signature);

  if (data.file) {
    form.append('file', data.file);
  }

  return apiFetch<DisputeMessage>(`${API_BASE}/tasks/${taskId}/dispute`, {
    method: 'POST',
    body: form,
  });
}
