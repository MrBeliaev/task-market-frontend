import { keccak256, stringToBytes } from 'viem';

/** keccak256("ADMIN_ROLE"), matches the TaskMarket.ADMIN_ROLE constant on-chain. */
export const ADMIN_ROLE: `0x${string}` = keccak256(stringToBytes('ADMIN_ROLE'));
