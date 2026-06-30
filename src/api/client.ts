export const API_BASE: '/api' = '/api';

export class ApiError extends Error {
  constructor (
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T> (url: string, init?: RequestInit): Promise<T> {
  const res: Response = await fetch(url, init);
  if (!res.ok) {
    const body: Partial<{ error: string }> = await res.json().catch(() => ({})) as Partial<{ error: string }>;
    throw new ApiError(body.error ?? `HTTP ${res.status}`, res.status);
  }

  return res.json() as Promise<T>;
}
