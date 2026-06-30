import {
  fetchTasks,
  fetchTask,
  createTaskMetadata,
  applyToTask,
  addComment,
} from './task.api';

function mockFetchOnce (body: unknown, ok = true) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe('task.api', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetchTasks builds a query string from the given params', async () => {
    mockFetchOnce({ tasks: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });

    await fetchTasks({ page: '1', status: 'OPEN' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/tasks?page=1&status=OPEN',
      undefined,
    );
  });

  it('fetchTasks omits the query string when no params are given', async () => {
    mockFetchOnce({ tasks: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });

    await fetchTasks();

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/tasks', undefined);
  });

  it('fetchTask requests the task by id', async () => {
    mockFetchOnce({ id: 1 });

    await fetchTask(1);

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/tasks/1', undefined);
  });

  it('createTaskMetadata POSTs JSON to /api/tasks', async () => {
    mockFetchOnce({ id: 1 });
    const payload: Parameters<typeof createTaskMetadata>[0] = {
      onChainId: 1,
      chainId: 1,
      client: '0xabc',
      signature: '0xsig',
      reward: '1000',
      deadline: '2026-01-01T00:00:00.000Z',
      metadataHash: '0xhash',
      title: 'Title',
      description: 'Description',
      contactInfo: 'tg:foo',
    };

    await createTaskMetadata(payload);

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  });

  it('applyToTask POSTs to the tasks applications endpoint', async () => {
    mockFetchOnce({ id: 1 });
    const data: Parameters<typeof applyToTask>[1] = { applicant: '0xabc', message: 'pick me', signature: '0xsig' };

    await applyToTask(5, data);

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/tasks/5/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  });

  it('addComment POSTs to the tasks comments endpoint', async () => {
    mockFetchOnce({ id: 1 });
    const data: Parameters<typeof addComment>[1] = { author: '0xabc', content: 'nice', signature: '0xsig' };

    await addComment(5, data);

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/tasks/5/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  });
});
