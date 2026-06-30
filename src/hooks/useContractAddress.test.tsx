import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChainId } from 'wagmi';
import { fetchChains } from '../api';
import { useContractAddress } from './useContractAddress';

jest.mock('wagmi', () => ({ useChainId: jest.fn() }));
jest.mock('../api', () => ({ fetchChains: jest.fn() }));

function wrapper ({ children }: { children: ReactNode }) {
  const queryClient: QueryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useContractAddress', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns the contract address matching the active chain', async () => {
    (useChainId as jest.Mock).mockReturnValue(11155111);
    (fetchChains as jest.Mock).mockResolvedValue([
      { chainId: 11155111, contractAddress: '0xabc' },
      { chainId: 1, contractAddress: '0xdef' },
    ]);

    const { result } = renderHook(() => useContractAddress(), { wrapper });

    await waitFor(() => expect(result.current).toBe('0xabc'));
  });

  it('returns undefined when the active chain is not configured', async () => {
    (useChainId as jest.Mock).mockReturnValue(999);
    (fetchChains as jest.Mock).mockResolvedValue([{ chainId: 1, contractAddress: '0xdef' }]);

    const { result } = renderHook(() => useContractAddress(), { wrapper });

    await waitFor(() => expect(fetchChains).toHaveBeenCalled());
    expect(result.current).toBeUndefined();
  });
});
