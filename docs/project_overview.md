# W3PI Frontend Documentation

## Project Overview

**W3PI (Web3 Portfolio Intelligence)** is a decentralized portfolio management platform built with ink! smart contracts on the Polkadot ecosystem. This documentation covers the complete frontend implementation using Next.js 15 and Typink.

## Technology Stack

### Core Technologies
- **Frontend Framework**: Next.js 15 (App Router)
- **Smart Contract Integration**: Typink (by Dedot team)
- **Blockchain**: Pop Testnet (Polkadot parachain)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Package Manager**: npm/yarn

### Key Dependencies
```json
{
  "typink": "^0.15.0",
  "dedot": "^2.8.0",
  "next": "15.1.0",
  "react": "^18.2.0",
  "tailwindcss": "^3.4.0",
  "lucide-react": "^0.263.1"
}
```

## Smart Contracts

### Contract Architecture
1. **Oracle Contract** (`oracle.rs`)
   - Provides price feeds and market data
   - Manages token pricing information
   - Handles market cap and volume data

2. **Registry Contract** (`registry.rs`)
   - Manages token registrations
   - Stores portfolio configurations
   - Handles token metadata and balances

### Generated Types
- Used Dedot CLI to generate TypeScript types from contract metadata
- Command: `npx dedot typink -m src/contracts/artifacts/oracle/oracle.json -o src/contracts/types`

## Network Configuration

### Pop Testnet Setup
- **Network ID**: `pop_testnet`
- **RPC Endpoint**: `wss://rpc2.paseo.popnetwork.xyz/`
- **Native Token**: PAS (Paseo tokens)
- **Decimals**: 10
- **Faucet**: https://onboard.popnetwork.xyz

### Why Pop Testnet?
- Polkadot parachain optimized for smart contracts
- Stable testnet environment
- Good developer tooling support
- Compatible with ink! contracts

## Project Structure

```
src/
├── app/
│   ├── globals.css           # Global styles
│   ├── layout.tsx           # Root layout with providers
│   └── page.tsx             # Main homepage
├── components/
│   └── wallet-connector.tsx  # Wallet connection component
├── contracts/
│   ├── artifacts/oracle/     # Contract build artifacts
│   ├── types/               # Generated TypeScript types
│   └── deployments.ts      # Contract deployment config
├── providers/
│   ├── main-provider.tsx   # Typink provider setup
│   └── app-provider.tsx    # App-specific context
└── types/
    └── contracts.ts         # Contract type definitions
```

## Key Features Implemented

### 1. Wallet Connection
- Support for multiple Polkadot wallets (Polkadot.js, Talisman, SubWallet)
- Auto-detection of installed wallet extensions
- Account switching and management
- Real-time balance display
- Connection state management with feedback

### 2. Network Management
- Pop Testnet integration
- Custom network configuration
- Network status indicators
- RPC endpoint management

### 3. Contract Integration
- Type-safe contract interactions
- Automated type generation
- Contract deployment management
- Error handling and validation

### 4. User Interface
- Responsive design with Tailwind CSS
- Dark mode support
- Loading states and animations
- Connection feedback and status indicators
- Account management dropdown

## Development Approach

### Step-by-Step Implementation
1. **Project Setup** - Next.js 15 with TypeScript
2. **Typink Integration** - Provider setup and configuration
3. **Network Configuration** - Pop Testnet custom setup
4. **Contract Types** - Generated from ink! metadata
5. **Wallet Connection** - Multi-wallet support with Typink
6. **UI Components** - Responsive interface with Tailwind
7. **State Management** - React hooks and context

### Design Principles
- **Type Safety** - Full TypeScript coverage
- **User Experience** - Clear feedback and intuitive interface
- **Modularity** - Reusable components and providers
- **Debugging** - Console logging and development tools
- **Performance** - Optimized rendering and state updates