import { useChainId } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { fetchChains } from '../api';

/**
 * Returns the TaskMarket contract address for the currently connected chain,
 * fetched from the backend (which reads from the chain_config DB table).
 * Returns undefined while loading or if the chain is not configured.
 */
export function useContractAddress (): `0x${string}` | undefined {
  const chainId: number = useChainId();

  const { data: chains } = useQuery({
    queryKey: ['chains'],
    queryFn: fetchChains,
    staleTime: 5 * 60 * 1000, // re-fetch at most every 5 min
  });

  return chains?.find((c) => c.chainId === chainId)?.contractAddress;
}
