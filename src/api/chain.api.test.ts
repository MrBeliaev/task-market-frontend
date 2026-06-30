import type { PublicChainConfig } from '../types';
import { fetchChains } from './chain.api';

describe('chain.api', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetchChains requests the public chains endpoint with no auth headers', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ chainId: 1, contractAddress: '0xabc' }],
    }) as unknown as typeof fetch;

    const result: PublicChainConfig[] = await fetchChains();

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/chains', undefined);
    expect(result).toEqual([{ chainId: 1, contractAddress: '0xabc' }]);
  });
});
