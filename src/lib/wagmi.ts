import { http, createConfig } from 'wagmi';
import { sepolia, base, arbitrum } from 'wagmi/chains';

// Explicit annotations here would widen the literal `as const` tuple that wagmi
// needs to type-check chain ids and contract calls throughout the app.
// eslint-disable-next-line @typescript-eslint/typedef
export const SUPPORTED_CHAINS = [sepolia, base, arbitrum] as const;

// eslint-disable-next-line @typescript-eslint/typedef
export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  transports: {
    [sepolia.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
  },
});
