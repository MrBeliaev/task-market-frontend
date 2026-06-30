import type { PublicChainConfig } from '../types';
import { API_BASE, apiFetch } from './client';

/** Public endpoint, no auth required. Returns enabled chains with contract addresses. */
export function fetchChains (): Promise<PublicChainConfig[]> {
  return apiFetch<PublicChainConfig[]>(`${API_BASE}/chains`);
}
