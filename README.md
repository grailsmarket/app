<p align="center">
  <a href="https://grails.app">
    <img src="https://grails.app/logo-w-text.svg" alt="Grails Market" width="320" />
  </a>
</p>

<h3 align="center">ENS Manager & Market</h3>

<p align="center">
  0% market fees. Bulk tools. Open source.
</p>

<p align="center">
  <a href="https://grails.app"><img src="https://img.shields.io/badge/live-grails.app-000?style=flat-square" alt="Live site" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Bun-1.x-fbf0df?style=flat-square&logo=bun" alt="Bun" />
  <a href="https://x.com/grailsmarket"><img src="https://img.shields.io/badge/follow-@grailsmarket-1d9bf0?style=flat-square&logo=x" alt="Follow on X" /></a>
</p>

---

## About

Grails is an open-source marketplace and manager for ENS names. It supports search and discovery, single and bulk listings/offers via Seaport, registration and renewal, profile and records management, on-chain activity, watchlists, leaderboards and chat — across Ethereum, Base and Optimism.

This repository is the web app. It is one of three components:

- **App** (this repo) — Next.js frontend at [grails.app](https://grails.app)
- **Backend** — REST API and database — [grailsmarket/backend](https://github.com/grailsmarket/backend)
- **Contracts** — Solidity smart contracts — [grailsmarket/contracts](https://github.com/grailsmarket/contracts)

## Tech stack

- **Next.js 15** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **wagmi** + **viem** + **RainbowKit** for wallet/chain interactions
- **@opensea/seaport-js** for listings and offers
- **TanStack Query** for data fetching
- **Redux Toolkit** + **redux-persist** for client state
- **Vercel OG** + **Puppeteer** for dynamic preview images

## Getting started

### Prerequisites

- [Bun](https://bun.sh) 1.x (recommended) or Node.js 20+
- An EVM wallet for testing (MetaMask, Rainbow, Coinbase Wallet, etc.)

### Setup

```bash
git clone https://github.com/grailsmarket/app.git
cd app
bun install
cp .env.example .env.local
# fill in the values in .env.local (see below)
bun run dev
```

Open <http://localhost:3000>.

### Scripts

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `bun run dev`       | Start the dev server (Turbopack) |
| `bun run build`     | Production build                 |
| `bun run start`     | Run the production build         |
| `bun run lint`      | ESLint                           |
| `bun run typecheck` | TypeScript check                 |
| `bun run format`    | Prettier                         |
| `bun run checks`    | Format + lint + typecheck        |

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values. Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

### Wallet & RPC

| Variable                                | Required    | Description                                                |
| --------------------------------------- | ----------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | yes         | WalletConnect Cloud project ID for client-side connections |
| `WALLET_CONNECT_PROJECT_ID`             | yes         | Same value, used server-side                               |
| `NEXT_PUBLIC_QUICKNODE_ID`              | recommended | QuickNode endpoint ID (fallback RPC across all chains)     |
| `NEXT_PUBLIC_MAINNET_ALCHEMY_ID`        | recommended | Alchemy app key for Ethereum mainnet                       |
| `NEXT_PUBLIC_SEPOLIA_ALCHEMY_ID`        | optional    | Alchemy app key for Sepolia                                |
| `NEXT_PUBLIC_BASE_ALCHEMY_ID`           | recommended | Alchemy app key for Base                                   |
| `NEXT_PUBLIC_BASE_SEPOLIA_ALCHEMY_ID`   | optional    | Alchemy app key for Base Sepolia                           |
| `NEXT_PUBLIC_OPTIMISM_ALCHEMY_ID`       | recommended | Alchemy app key for Optimism                               |
| `NEXT_PUBLIC_OP_SEPOLIA_ALCHEMY_ID`     | optional    | Alchemy app key for Optimism Sepolia                       |

Public RPCs are used as a final fallback, but reliable Alchemy / QuickNode keys are strongly recommended.

### OpenSea / Seaport

| Variable                      | Required | Description                                                      |
| ----------------------------- | -------- | ---------------------------------------------------------------- |
| `OPENSEA_API_KEY`             | yes      | Server-side OpenSea API key                                      |
| `NEXT_PUBLIC_OPENSEA_API_KEY` | yes      | Client-side OpenSea API key                                      |
| `NEXT_PUBLIC_OPENSEA_API_URL` | yes      | OpenSea API base URL (e.g. `https://api.opensea.io`)             |
| `NEXT_PUBLIC_USE_CONDUIT`     | optional | Set to `true` to route Seaport orders through the Grails conduit |

### ENS metadata

| Variable                                | Required | Description                           |
| --------------------------------------- | -------- | ------------------------------------- |
| `ENS_METADATA_URL`                      | optional | Base URL of the ENS metadata service  |
| `ENS_METADATA_CACHE_INVALIDATION_TOKEN` | optional | Token used to bust the metadata cache |

### Misc

| Variable                     | Required | Description                                       |
| ---------------------------- | -------- | ------------------------------------------------- |
| `NODE_ENV`                   | yes      | `development` or `production`                     |
| `NODE_OPTIONS`               | optional | Defaults to `--no-warnings`                       |
| `CHROMIUM_LOCAL_EXEC_PATH`   | optional | Local Chromium path for OG-image rendering in dev |
| `NEXT_PUBLIC_CAN_CLAIM_POAP` | optional | Feature flag for POAP claim UI                    |

## Project layout

```
src/
  api/            HTTP clients for the Grails backend
  app/            Next.js App Router routes, layouts, and API routes
  components/    Shared UI (navigation, modals, filters, chat, ...)
  constants/      Chain, contract, and app-wide constants
  context/        React context providers
  hooks/          Reusable hooks
  lib/            Wagmi config, Seaport client, metadata
  state/          Redux store and slices
  types/          Shared TypeScript types
  utils/          Helpers (formatting, web3, etc.)
public/           Static assets (logos, icons, OG previews)
```

## Related repositories

| Repo                                                                | Purpose                                                                                        |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [grailsmarket/app](https://github.com/grailsmarket/app)             | This Next.js frontend                                                                          |
| [grailsmarket/backend](https://github.com/grailsmarket/backend)     | REST API and Postgres database powering listings, offers, activity, chat, search and analytics |
| [grailsmarket/contracts](https://github.com/grailsmarket/contracts) | Solidity smart contracts (Seaport conduit, registration helpers, on-chain logic)               |

## Contributing

Issues and pull requests are welcome. Run `bun run checks` before opening a PR.

## License

[MIT](./LICENSE) &copy; Grails: ENS Market & Manager
