import { TextEncoder, TextDecoder } from 'node:util';

import '@testing-library/jest-dom';

// jsdom doesn't provide these globals, but viem (used by wagmi) needs them.
Object.assign(globalThis, { TextEncoder, TextDecoder });
