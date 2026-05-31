# AGENTS.md

This file is the working memory for agents in this repository. Read it before changing code, debugging deployment, or answering repo-specific questions.

## Project Snapshot

- App: W3PI / VRCI Dashboard, a Next.js 15 App Router dashboard for an ink!/revive portfolio system on Passet Hub / Polkadot-style networks.
- Stack: Next.js 15, React 19, TypeScript, Tailwind CSS v4, Radix UI, Typink, Dedot, Polkadot.js API, TanStack Query, Prisma, PostgreSQL, Zod.
- Package manager reality: `package.json` scripts are npm-oriented, but the repo also has `bun.lockb` and Prisma seed uses Bun.
- Current tracked app entrypoints:
  - `src/app/layout.tsx`: root providers, `TypinkWrapper`, wallet guard, dashboard layout, toast container.
  - `src/app/providers.tsx`: TanStack Query provider and progress bar.
  - `src/providers/TypinkProvider.tsx`: network, RPC, contract metadata, contract address selection.
  - `src/app/page.tsx`: main dashboard screen.
- Main contract groups: token, oracle, registry, portfolio, staking, dex.
- API layer: Next App Router handlers under `src/app/api`, validation in `src/lib/api/schemas.ts`, response types in `src/lib/api/types.ts`.
- Database: Prisma schema in `prisma/schema.prisma`, generated client output is `src/generated/client`.

## Folder Structure

```text
.
├── src/
│   ├── app/                  # Next.js App Router pages, layouts, providers, and API routes
│   │   ├── api/              # Route handlers for contracts, tokens, whitelist, state, health, oracle
│   │   ├── admin/            # Admin UI, token detail page, whitelist/token management
│   │   ├── oracle/           # Oracle dashboard route
│   │   ├── registry/         # Registry dashboard route
│   │   ├── token/            # Token dashboard route
│   │   ├── portfolio/        # Portfolio dashboard route
│   │   ├── staking/          # Staking dashboard route
│   │   └── dex/              # DEX dashboard route
│   ├── components/           # UI, dashboard cards, domain widgets, wallet/auth components
│   │   ├── ui/               # Shared Radix/Tailwind UI primitives
│   │   ├── admin/            # Admin token and whitelist components
│   │   ├── oracle/           # Oracle-specific panels and actions
│   │   ├── registry/         # Registry-specific panels and actions
│   │   ├── token/            # Token-specific panels and actions
│   │   ├── portfolio/        # Portfolio-specific panels and actions
│   │   ├── staking/          # Staking-specific panels and actions
│   │   └── dex/              # DEX-specific panels and actions
│   ├── contracts/metadata/   # ink!/revive contract metadata JSON files
│   ├── generated/client/     # Generated Prisma client output
│   ├── hooks/                # App hooks, including TanStack Query API hooks in `hooks/api`
│   ├── lib/                  # API schemas/types, Prisma, RPC, contract addresses, generated contract types
│   ├── providers/            # Typink network/deployment configuration
│   └── utils/                # Small app utilities
├── prisma/                   # Prisma schema, migrations, and seed script
├── docs/                     # Project docs and historical architecture/setup notes
├── helpers/                  # Local helper scripts for direct operational tasks
├── public/                   # Static assets
├── __tests__/                # Vitest/Jest-style tests
├── .devcontainer/            # VS Code devcontainer and local Postgres setup
└── .vercel/                  # Vercel project metadata when present
```

Keep feature work close to its domain folder. Shared primitives belong in `src/components/ui`; API client hooks belong in `src/hooks/api`; server route contracts and validation belong under `src/app/api` and `src/lib/api`.

## SDK Packages

Use the SDKs already installed in `package.json`; do not introduce parallel Web3 or data-fetching stacks unless the user explicitly asks for a migration.

- `typink`: primary React SDK for wallet-aware ink!/revive contract integration. App-level setup is in `src/app/typink-wrapper.tsx`, with deployments/network exports sourced from `src/providers/TypinkProvider.tsx`.
- `dedot` and `@dedot/chaintypes`: contract type generation and typed Polkadot/ink! helpers. Regenerate contract bindings with `npm run contracts:gen` after metadata changes.
- `@polkadot/api` and `@polkadot/api-contract`: lower-level Polkadot.js APIs used by server routes such as `src/app/api/contracts/[name]/call/route.ts` and the singleton client in `src/lib/polkadotClient.ts`.
- `@polkadot/keyring`, `@polkadot/util`, and `@polkadot/react-identicon`: account utilities and address/identity UI support.
- `ethers`: EVM/H160 utility support where revive-compatible 20-byte addresses are needed.
- `@tanstack/react-query`: client-side server-state cache. Keep API hooks in `src/hooks/api` and use the existing `QueryClient` setup in `src/app/providers.tsx`.
- `prisma` and `@prisma/client`: PostgreSQL ORM. The generated client output is customized to `src/generated/client`, so imports should follow existing repo patterns instead of defaulting to `@prisma/client`.
- `zod`: runtime validation for API route inputs in `src/lib/api/schemas.ts` and related API surfaces.
- UI/runtime packages: `@radix-ui/*`, `lucide-react`, `recharts`, `sonner`, `react-toastify`, `next-themes`, `@bprogress/next`, `class-variance-authority`, `clsx`, and `tailwind-merge`.
- Test packages: `vitest`, `@vitest/ui`, `@testing-library/react`, `@testing-library/jest-dom`, `jest`, `ts-jest`, and `node-mocks-http`.

Prefer Typink hooks for client contract UX, Polkadot.js `ContractPromise` only where the existing API layer already uses it, Prisma for persisted data, TanStack Query for browser API state, and Zod for request boundaries.

## Workspace

- Work from the repository root: `VRCI-Dashboard/`.
- Treat `.env.local`, `.vercel/`, `.next/`, `node_modules/`, `tsconfig.tsbuildinfo`, and local IDE/tooling folders as machine-local unless the user explicitly asks about them.
- Do not commit or document secrets. Use `env.example` to describe required environment variable names.
- `src/generated/client` is generated by Prisma. Regenerate it with `npx prisma generate` after Prisma schema changes rather than editing generated client files by hand.
- `src/lib/contracts/*` files are generated from `src/contracts/metadata/*.json` by `npm run contracts:gen`. Edit metadata/source inputs first, then regenerate.
- `.agents/` and `skills-lock.json` may exist as local agent tooling. Do not modify them unless the task is explicitly about agent skills or tooling.
- The repo may contain user edits in progress. Always inspect `git status --short` before edits and avoid cleaning, resetting, or deleting unrelated files.

## First Moves

1. Check `git status --short` before editing. This repo often has user or generated changes; do not revert files you did not change.
2. Prefer `rg` / `rg --files` for search. Quote bracketed App Router paths in zsh, for example:
   ```bash
   sed -n '1,220p' 'src/app/api/contracts/[name]/call/route.ts'
   ```
3. Read the live source before trusting older docs. Several docs still describe earlier Pop Testnet / Next / Typink versions.
4. If a user asks for diagnosis only, stay diagnostic. Do not scaffold or patch until asked.
5. Do not echo secrets from `.env.local` or user messages. Use `env.example` for public variable names.

## Package Scripts

These scripts are defined in `package.json`:

- `npm run dev`: start Next.js dev server with Turbopack on `0.0.0.0`.
- `npm run build`: run `prisma generate`, `prisma migrate deploy`, then `next build`.
- `npm run vercel-build`: same build path as `npm run build`.
- `npm run start`: run `prisma migrate deploy`, then `next start`.
- `npm run lint`: run Next linting.
- `npm run test`: run Vitest once.
- `npm run test:watch`: run Vitest in watch mode.
- `npm run test:ui`: run Vitest UI.
- `npm run test:coverage`: run Vitest with coverage.
- `npm run contracts:gen`: regenerate Typink/Dedot contract bindings from `src/contracts/metadata/*.json` into `src/lib/contracts`.
- `npm run db:seed`: seed the database through Prisma/Bun.
- `npm run deploy`: deploy to production with Vercel CLI.
- `npm run deploy:preview`: create a Vercel preview deployment.
- `npm run vercel:env`: pull Vercel env values into `.env.local`.

Build and start scripts currently run database migrations. If the database is unavailable, build/start failures may be database reachability failures rather than TypeScript or Next.js errors.

### Using Turbo to Target Specific Packages

This repo currently uses Next.js Turbopack through `npm run dev`; it does not currently define a Turborepo workspace (`turbo.json`, `workspaces`, or `pnpm-workspace.yaml`). If the repo becomes a monorepo later, use the `turbo` CLI to target specific packages instead of running every task globally.

Useful examples:

```bash
npx turbo run build --filter=<package-name>
npx turbo run test --filter=<package-name>
npx turbo run lint --filter=<package-name>
npx turbo run dev --filter=<package-name>
npx turbo run build --filter=<package-name>...
npx turbo run test --filter=...[origin/main]
```

Use package names from each package's `package.json`, not folder guesses. Verify the workspace config before relying on `--filter`.

## Code Style and Linting

### ESLint

- The only lint script currently defined is `npm run lint`, which runs `next lint`.
- There is no tracked ESLint config file in this checkout, and `package.json` does not currently include `eslint`, `prettier`, or `eslint-plugin-posthog-js` dependencies.
- Do not document or assume repository-specific PostHog lint rules unless those dependencies/config files are added later.
- Existing code uses some inline ESLint disables, mostly for `@next/next/no-img-element` and `@typescript-eslint/no-explicit-any`; keep new disables narrow and line-specific.
- TypeScript is configured through `tsconfig.json`; use `npm run build` when lint behavior is unavailable or insufficient because the build also validates TypeScript/Next.js constraints.

### Formatting

- No Prettier config is currently tracked. Match nearby file style manually: TypeScript, path alias `@/`, single quotes in most TS/TSX files, and kebab-case filenames.
- Avoid broad formatting-only diffs unless the user explicitly asks for formatting cleanup.

## Release Notes and Changesets

This repo does not currently use Changesets:

- No `.changeset/` directory is tracked.
- `package.json` does not include `@changesets/cli` or changeset scripts.
- No `pnpm-workspace.yaml` or pnpm lockfile is present.
- The root package is marked `"private": true`, so there is no current npm package release flow.

If this repo later needs Changesets for package releases, add the tooling deliberately:

```bash
npm install --save-dev @changesets/cli
npx changeset init
```

Then add scripts like:

```json
{
  "scripts": {
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "changeset publish"
  }
}
```

For a pnpm monorepo, also add `pnpm-workspace.yaml`, install `@changesets/cli`, and use:

```bash
pnpm changeset
```

Only require changesets for changes that affect releasable packages. For this private dashboard app, normal PR descriptions or deployment notes are usually enough unless a package publishing workflow is introduced.

## Commands

```bash
npm run dev
npm run build
npm run start
npm run test
npm run test:watch
npm run test:coverage
npm run contracts:gen
npm run db:seed
npx prisma generate
npx prisma migrate deploy
```

Important behavior: `npm run build`, `npm run vercel-build`, and `npm run start` currently run `prisma migrate deploy`. Any environment without reachable PostgreSQL can fail during build/start with Prisma connectivity errors.

The dev server command is:

```bash
next dev --hostname 0.0.0.0 --turbopack
```

## Local Setup

- Devcontainer files live in `.devcontainer/`.
- Devcontainer starts services `app` and `db`, forwards ports `3000` and `5432`, and sets:
  ```text
  DATABASE_URL=postgresql://postgres:postgres@db:5432/w3pi?schema=public
  ```
- After opening in the devcontainer, initialize with:
  ```bash
  npx prisma migrate deploy
  bunx prisma db seed
  npm run dev
  ```
- Host browser wallet extensions are still needed; do not expect wallet extensions inside the container.

## Environment Rules

- `DATABASE_URL` and `DATABASE_URL_UNPOOLED` are server-side Prisma values. Do not expose them as `NEXT_PUBLIC_*`.
- `CMC_API_KEY` is server-side only.
- `NEXT_PUBLIC_*` values are bundled/exposed to the browser. Treat them as public.
- `src/providers/TypinkProvider.tsx` chooses contract and RPC values using:
  ```ts
  const isDevelopment = process.env.NODE_ENV === 'development';
  ```
- In development, Typink prefers `_DEV` values and falls back to base values.
- In production, Typink reads only base names such as `NEXT_PUBLIC_TOKEN_ADDRESS`, `NEXT_PUBLIC_ORACLE_ADDRESS`, `NEXT_PUBLIC_REGISTRY_ADDRESS`, `NEXT_PUBLIC_PORTFOLIO_ADDRESS`, `NEXT_PUBLIC_STAKING_ADDRESS`, and `NEXT_PUBLIC_DEX_ADDRESS`.
- Do not "fix" production address issues by editing only `_DEV` variables. Production needs the base variables.
- Server API contract routes also resolve base names with `NEXT_PUBLIC_${name.toUpperCase()}_ADDRESS`; they do not use `_DEV` names unless an explicit `address` is supplied in the request body.

## Network And Contract Wiring

- Current provider network id in code is `passet_hub_testnet`.
- `src/lib/rpc.ts` normalizes RPC values and returns fallback provider arrays.
- `src/providers/TypinkProvider.tsx` imports metadata from `src/contracts/metadata/*.json` and builds the Typink `deployments` array.
- Generated contract types live in `src/lib/contracts/<contract>/`.
- Regenerate Typink/Dedot contract types after metadata changes:
  ```bash
  npm run contracts:gen
  ```
- H160 revive addresses are 20-byte hex values like `0x...` with 40 hex chars. SS58 account addresses are different. Do not casually substitute one for the other.
- Empty or malformed contract addresses can crash Typink or make contract features silently unusable. Validate whether the relevant base or `_DEV` variable is actually populated for the current `NODE_ENV`.

## App And API Map

- Pages:
  - `src/app/page.tsx`: dashboard
  - `src/app/admin/page.tsx`: admin/token/whitelist UI
  - `src/app/oracle/page.tsx`, `src/app/registry/page.tsx`, `src/app/token/page.tsx`, `src/app/portfolio/page.tsx`, `src/app/staking/page.tsx`, `src/app/dex/page.tsx`
- Generic contract API:
  - `GET /api/contracts`
  - `GET /api/contracts/[name]/methods`
  - `POST /api/contracts/[name]/call`
  - `POST /api/contracts/[name]/tx`
- Database-backed API:
  - `GET/POST /api/tokens`
  - `GET/PATCH/DELETE /api/tokens/[id]`
  - `GET/POST /api/whitelist`
  - `GET /api/whitelist/check?address=...`
  - `DELETE /api/whitelist/[id]`
  - `GET/POST /api/state`
  - `GET /api/health`
- `/api/health` checks API, database, and Polkadot RPC. It returns `503` when database is down.

## Whitelist Memory

- Source of truth for sample direct DB insert: `helpers/whitelistAdd.ts`.
- API contract:
  ```http
  POST /api/whitelist
  Content-Type: application/json
  ```
  ```json
  {
    "address": "5...",
    "note": "optional note",
    "addedBy": "optional admin address"
  }
  ```
- Duplicate addresses return HTTP `409` with `Address <address> is already whitelisted`.
- Membership check is:
  ```http
  GET /api/whitelist/check?address=<address>
  ```

## Prisma And Database

- Prisma imports from custom generated output `src/generated/client`, not default `@prisma/client`.
- `src/lib/prisma.ts` intentionally allows `prisma` to be undefined when `DATABASE_URL` is missing or generation has not happened. API routes should return clear `503` responses in that case.
- Models: `Wallet`, `Log`, `Token`, `Whitelist`.
- For schema changes, update `prisma/schema.prisma`, create migrations intentionally, regenerate the client, and add focused tests where route behavior changes.

## Contract Call Caveats

- `src/app/api/contracts/[name]/call/route.ts` uses `@polkadot/api-contract` `ContractPromise`, reads metadata from disk, and currently has a hardcoded caller:
  ```text
  5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
  ```
- `src/providers/TypinkProvider.tsx` has a different default caller:
  ```text
  5FAAUGRrj9AFCYKFKZjS3fUMh4ntZFVrRvDTX2NjcQRr15da
  ```
- If contract queries fail unexpectedly, verify caller mapping and address type before rewriting contract code.
- `Revive::AccountUnmapped` means the signer/caller is not mapped in pallet-revive. The practical fix is usually mapping the actual account with `revive.mapAccount()` from that account, for example through Polkadot.js Apps Developer -> Extrinsics.
- Generic tx route prepares an unsigned extrinsic; browser/client wallet signing is still required.
- For the browser-side Typink/Dedot transaction signing and gas/fee estimation flow, including `useContractTx`, dry-run checks, wallet signing, broadcasting, progress callbacks, `gasRequired`, `storageDeposit`, and `paymentInfo`, see `docs/contract-transaction-signing-and-gas.md`.

## Documentation Guide

Use docs as orientation, not final truth:

- `README.md`: broad setup and feature overview.
- `docs/contract-transaction-signing-and-gas.md`: browser-side Typink/Dedot contract transaction flow and gas/fee estimation notes using the Oracle `addUpdater` action as the worked example.
- `docs/setup_guide.md`: useful devcontainer and setup notes, but parts still show old scaffold examples.
- `docs/project_overview.md`, `docs/architecture_decisions.md`, `docs/challenges_solutions.md`: historical architecture context.
- `API_LAYER_SUMMARY.md`: API layer overview and endpoint list.
- `CONTRACTS_ROADMAP.md`: intended contract coverage and implementation status.
- `docs/TOKEN_DEPLOYMENTS.md`: deployed test token addresses and old deployment command examples.

When docs and source disagree, source wins. If fixing docs, update the stale source and mention the mismatch.

## Coding Standards

- Follow existing file style: TypeScript, path alias `@/`, single quotes in most TS/TSX files, kebab-case filenames.
- Use Server Components by default in App Router; add `'use client'` only for hooks, wallet interactions, browser APIs, or local UI state.
- Keep Zod validation at API boundaries.
- Keep API responses in the existing `{ success, data?, error? }` shape.
- Prefer existing UI components from `src/components/ui`.
- Use TanStack Query hooks under `src/hooks/api` for client-side API state.
- Do not add broad refactors while fixing a narrow runtime/deployment issue.

## Verification Checklist

Pick the smallest verification that proves the change:

- Type/build-sensitive app changes: `npm run build`
- API logic: `npm run test` or a focused Vitest file
- Prisma changes: `npx prisma generate` plus migration verification
- Contract metadata changes: `npm run contracts:gen` and inspect generated diffs
- UI changes: run `npm run dev` and verify the affected page in a browser
- Deployment scripts/config: syntax-check scripts and document required env values

If a command fails because a private database, network, or secret is unavailable, report the exact failing command and error class instead of guessing.
