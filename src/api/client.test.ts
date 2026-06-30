import { apiFetch, ApiError } from './client';

describe('apiFetch', () => {
  const originalFetch: typeof fetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns the parsed JSON body on success', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hello: 'world' }),
    }) as unknown as typeof fetch;

    const result: { hello: string } = await apiFetch<{ hello: string }>('/api/whatever');

    expect(result).toEqual({ hello: 'world' });
  });

  it('throws ApiError with the server message and status on failure', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Task not found' }),
    }) as unknown as typeof fetch;

    await expect(apiFetch('/api/tasks/999')).rejects.toMatchObject({
      message: 'Task not found',
      status: 404,
    });
  });

  it('falls back to a generic HTTP message when the error body is not JSON', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json');
      },
    }) as unknown as typeof fetch;

    await expect(apiFetch('/api/tasks')).rejects.toMatchObject({
      message: 'HTTP 500',
      status: 500,
    });
  });

  it('ApiError carries its status as a readonly property', () => {
    const err: ApiError = new ApiError('nope', 403);
    expect(err.status).toBe(403);
    expect(err.name).toBe('ApiError');
    expect(err).toBeInstanceOf(Error);
  });
});
