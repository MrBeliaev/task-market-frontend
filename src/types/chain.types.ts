import type { EthAddress } from './common.types';

export interface PublicChainConfig {
  chainId: number;
  contractAddress: EthAddress;
}
