# Complete Setup Guide

## Prerequisites

### Required Software

- **Node.js**: v20 or higher
- **npm/yarn**: Latest version
- **Git**: For cloning repositories

## Devcontainer Setup

Use this path if you want the project running with Docker/VS Code instead of installing Node and PostgreSQL directly on your host.

### Requirements

- Docker Desktop or Docker Engine
- VS Code
- Dev Containers extension for VS Code

### Start The Workspace

1. Open the repository in VS Code.
2. Run `Dev Containers: Reopen in Container`.
3. Wait for the post-create script to install dependencies and generate Prisma client.

The Devcontainer provides:

- Node.js 20
- Bun
- PostgreSQL 16
- `DATABASE_URL=postgresql://postgres:postgres@db:5432/w3pi?schema=public`

### Initialize The Database

Run these commands inside the Devcontainer terminal:

```bash
npx prisma migrate deploy
bunx prisma db seed   # optional
npm run dev
```

Open `http://localhost:3000` in your host browser. Keep wallet extensions installed on the host browser, not inside the container.

### Required Browser Extensions

- **Polkadot.js Extension** OR
- **Talisman Wallet** OR
- **SubWallet**

### Accounts & Tokens

- Polkadot account with some PAS tokens from Pop Testnet faucet
- Access to https://onboard.popnetwork.xyz for getting testnet tokens

## Step 1: Project Initialization

### Create Next.js Project

```bash
npx create-next-app@latest w3pi-frontend --typescript --tailwind --app
cd w3pi-frontend
```

### Install Dependencies

```bash
npm install typink dedot @types/node @types/react @types/react-dom lucide-react clsx
```

### Package.json Configuration

```json
{
  "name": "w3pi-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typink": "^0.15.0",
    "dedot": "^2.8.0",
    "typescript": "^5",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.263.1",
    "clsx": "^2.0.0"
  }
}
```

## Step 2: Contract Setup

### Deploy Contracts

1. **Build contracts** using cargo-contract:

```bash
cd contracts/oracle
cargo contract build --release
```

2. **Deploy to Pop Testnet** using pop-cli or contracts-ui

3. **Note contract addresses** for configuration

### Generate TypeScript Types

```bash
# Install dedot CLI globally
npm install -g @dedot/cli

# Generate types from contract metadata
npx dedot typink -m src/contracts/artifacts/oracle/oracle.json -o src/contracts/types
```

### Contract Artifacts Structure

```
src/contracts/
├── artifacts/
│   └── oracle/
│       ├── oracle.json      # Contract metadata
│       ├── oracle.wasm      # Contract bytecode
│       └── oracle.contract  # Combined file
├── types/
│   └── oracle.ts           # Generated TypeScript types
└── deployments.ts          # Deployment configuration
```

## Step 3: Environment Configuration

### Create Environment File

```bash
# .env.local
NEXT_PUBLIC_ORACLE_ADDRESS=your_deployed_oracle_address_here
NEXT_PUBLIC_REGISTRY_ADDRESS=your_deployed_registry_address_here
```

### Deployments Configuration

```typescript
// src/contracts/deployments.ts
export enum ContractId {
  ORACLE = "oracle",
  REGISTRY = "registry",
}

import oracleMetadata from "./artifacts/oracle/oracle.json";

export const deployments = [
  {
    id: ContractId.ORACLE,
    network: "pop_testnet",
    address: process.env.NEXT_PUBLIC_ORACLE_ADDRESS || "",
    metadata: oracleMetadata as any,
  },
];
```

## Step 4: Provider Setup

### Main Provider Configuration

```typescript
// src/providers/main-provider.tsx
'use client';

import { ReactNode } from 'react';
import { TypinkProvider } from 'typink';
import { deployments } from '@/contracts/deployments';
import { AppProvider } from './app-provider';

const DEFAULT_CALLER = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

const customPopTestnet = {
    decimals: 10,
    faucetUrl: 'https://onboard.popnetwork.xyz',
    id: 'pop_testnet',
    logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/networks/pop-network.svg',
    name: 'POP Testnet',
    providers: ['wss://rpc2.paseo.popnetwork.xyz'],
    symbol: 'PAS',
}

const SUPPORTED_NETWORKS = [customPopTestnet];

interface Props {
    children: ReactNode;
}

export function MainProvider({ children }: Props) {
    return (
        <TypinkProvider
            appName="W3PI - Web3 Portfolio Intelligence"
            deployments={deployments}
            defaultCaller={DEFAULT_CALLER}
            defaultNetworkId={customPopTestnet.id}
            supportedNetworks={SUPPORTED_NETWORKS}
        >
            <AppProvider>
                {children}
            </AppProvider>
        </TypinkProvider>
    );
}
```

### App Provider Setup

```typescript
// src/providers/app-provider.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { ContractId } from '@/contracts/deployments';
import { OracleContractApi } from '@/contracts/types/oracle';
import { Contract } from 'dedot/contracts';
import { useContract } from 'typink';

interface AppContextProps {
  oracleContract?: Contract<OracleContractApi>;
}

const AppContext = createContext<AppContextProps>({} as AppContextProps);

export const useApp = () => {
  return useContext(AppContext);
};

interface Props {
  children: ReactNode;
}

export function AppProvider({ children }: Props) {
  const { contract: oracleContract } = useContract<OracleContractApi>(ContractId.ORACLE);

  return (
    <AppContext.Provider
      value={{
        oracleContract,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
```

## Step 5: Tailwind CSS Configuration

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#e6007a",
          50: "#fef2f7",
          100: "#fde6f0",
          // ... more shades
        },
      },
      animation: {
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
```

### Global Styles

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .loading-spinner {
    @apply animate-spin rounded-full border-2 border-gray-300 border-t-primary-600;
  }

  .card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6;
  }
}
```

## Step 6: Layout Integration

### Root Layout

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { MainProvider } from '@/providers/main-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'W3PI - Web3 Portfolio Intelligence',
  description: 'A decentralized portfolio management platform built with ink! smart contracts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <MainProvider>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">
              {children}
            </main>
          </div>
        </MainProvider>
      </body>
    </html>
  );
}
```

## Step 7: Wallet Connector Component

Create the wallet connector component following the patterns from our `wallet-connector.tsx` file (see the complete implementation in the artifacts).

## Step 8: Testing Setup

### Development Server

```bash
npm run dev
```

### Testing Checklist

- [ ] TypinkProvider initializes without errors
- [ ] Network shows as "POP Testnet"
- [ ] Wallet connection modal appears
- [ ] Wallet extensions are detected
- [ ] Connection succeeds and shows account info
- [ ] Account switching works
- [ ] Balance displays correctly
- [ ] Disconnect works properly

### Debugging Commands

```bash
# Check TypeScript compilation
npm run build

# Check for console errors
# Open browser DevTools → Console tab

# Verify network connectivity
# Check if wss://rpc2.paseo.popnetwork.xyz/ is accessible
```

## Step 9: Deployment Preparation

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables for Production

```bash
# .env.production
NEXT_PUBLIC_ORACLE_ADDRESS=production_oracle_address
NEXT_PUBLIC_REGISTRY_ADDRESS=production_registry_address
```

## Common Issues & Quick Fixes

### Issue: NetworkId not available

**Solution**: Ensure network IDs match between `customPopTestnet.id` and `deployments[].network`

### Issue: Metadata type errors

**Solution**: Use `metadata: oracleMetadata as any`

### Issue: RPC connection fails

**Solution**: Use `wss://rpc2.paseo.popnetwork.xyz/` instead of rpc1

### Issue: Wallet connects but no feedback

**Solution**: Implement auto-account selection in useEffect

### Issue: TypeScript errors on Typink hooks

**Solution**: Check official examples for correct property names

## Next Steps

1. **Add Contract Interactions** - Implement oracle data queries
2. **Portfolio Management** - Build registry contract integration
3. **UI Enhancements** - Add more responsive design elements
4. **Testing** - Implement unit and integration tests
5. **Performance** - Optimize rendering and state management
