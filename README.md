# TaskMarket Frontend

React single-page app for TaskMarket, a decentralised task marketplace on Ethereum. Users
connect a wallet, post tasks that lock ETH in escrow, apply to work, confirm completion, and
resolve disputes. The app talks to the smart contract through wagmi and to the backend for
off-chain metadata.

## Stack

- React 19 with Vite 8
- wagmi v3 and viem for wallet and contract interaction
- TanStack Query for server state
- Tailwind CSS 4
- React Router 7
- Jest with Testing Library

## Structure

```
src/
  types/        shared TypeScript types
  api/          one module per backend domain (tasks, chat, admin, ...)
  lib/          wagmi config, contract ABI, constants
  hooks/        reusable hooks (contract address, theme, chat socket)
  components/   shared UI (header, task card, chat panels)
  pages/        routed pages (task list, detail, create, my tasks, admin)
```

Routes are code-split with `React.lazy` so the initial bundle stays small. Live chat updates
arrive over a WebSocket via `useChatSocket`; everything else goes through TanStack Query.

## Getting started

```bash
npm install
cp .env.example .env        # optional, defaults point at localhost:3001
npm run dev                 # start Vite on http://localhost:5173
```

The dev server proxies `/api` and `/ws` to the backend, so run the backend alongside it.

## Scripts

| Script            | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start the Vite dev server                |
| `npm run build`   | Type-check and build to `dist/`          |
| `npm run preview` | Serve the production build locally       |
| `npm test`        | Run the Jest suite                       |
| `npm run lint`    | Lint `src/` with ESLint                  |

## Environment

These are read by `vite.config.ts` only and are never bundled into the app.

| Variable           | Description                                  |
| ------------------ | -------------------------------------------- |
| `VITE_BACKEND_URL` | Backend origin to proxy `/api` and `/ws` to  |
| `VITE_PORT`        | Dev server port (default 5173)               |

## Supported networks

Sepolia, Base, and Arbitrum. The active network is chosen by the connected wallet; the contract
address per chain is resolved from the backend chain registry.

## License

MIT
