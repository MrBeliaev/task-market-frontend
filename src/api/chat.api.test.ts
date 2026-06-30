import { fetchTaskMessages, postTaskMessage } from './chat.api';

function mockFetchOnce (body: unknown) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe('chat.api', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetchTaskMessages requests the tasks chat endpoint', async () => {
    mockFetchOnce([]);

    await fetchTaskMessages(7);

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/tasks/7/chat', undefined);
  });

  it('postTaskMessage sends a multipart form with sender, content, and signature', async () => {
    mockFetchOnce({ id: 1 });

    await postTaskMessage(7, { sender: '0xabc', content: 'hi', signature: '0xsig' });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/tasks/7/chat');
    expect(init.method).toBe('POST');
    const form: FormData = init.body as FormData;
    expect(form.get('sender')).toBe('0xabc');
    expect(form.get('content')).toBe('hi');
    expect(form.get('signature')).toBe('0xsig');
    expect(form.get('file')).toBeNull();
  });

  it('postTaskMessage attaches a file to the form when given', async () => {
    mockFetchOnce({ id: 1 });
    const file: File = new File(['data'], 'evidence.png', { type: 'image/png' });

    await postTaskMessage(7, { sender: '0xabc', content: 'hi', signature: '0xsig', file });

    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    const form: FormData = init.body as FormData;
    expect(form.get('file')).toBe(file);
  });
});
