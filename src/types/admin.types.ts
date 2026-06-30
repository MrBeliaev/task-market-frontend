import type { EthAddress } from './common.types';

export interface AdminHeaders extends Record<string, string> {
  'x-admin-address': string;
  'x-admin-signature': string;
  'x-admin-timestamp': string;
  'x-admin-chain-id': string;
}

export interface ChainConfigResponse {
  chainId: number;
  rpcUrl: string;
  contractAddress: EthAddress;
  startBlock: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
