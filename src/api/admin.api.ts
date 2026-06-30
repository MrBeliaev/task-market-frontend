import type {
  TaskResponse,
  DisputeMessage,
  AdminHeaders,
  ChainConfigResponse,
} from '../types';
import { API_BASE, apiFetch } from './client';

export function fetchAdminTasks (
  headers: AdminHeaders,
  status?: string,
): Promise<TaskResponse[]> {
  const query: string = status ? `?status=${status}` : '';
  return apiFetch<TaskResponse[]>(`${API_BASE}/admin/tasks${query}`, { headers });
}

export function fetchAdminDisputeDetail (
  taskId: number,
  headers: AdminHeaders,
): Promise<{ task: TaskResponse; messages: DisputeMessage[] }> {
  return apiFetch<{ task: TaskResponse; messages: DisputeMessage[] }>(
    `${API_BASE}/admin/tasks/${taskId}/dispute`,
    { headers },
  );
}

export function fetchAdminChains (headers: AdminHeaders): Promise<ChainConfigResponse[]> {
  return apiFetch<ChainConfigResponse[]>(`${API_BASE}/admin/chains`, { headers });
}

export function createAdminChain (
  data: { chainId: number; rpcUrl: string; contractAddress: string; startBlock?: number; enabled?: boolean },
  headers: AdminHeaders,
): Promise<ChainConfigResponse> {
  return apiFetch<ChainConfigResponse>(`${API_BASE}/admin/chains`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updateAdminChain (
  chainId: number,
  data: Partial<{ rpcUrl: string; contractAddress: string; startBlock: number; enabled: boolean }>,
  headers: AdminHeaders,
): Promise<ChainConfigResponse> {
  return apiFetch<ChainConfigResponse>(`${API_BASE}/admin/chains/${chainId}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
