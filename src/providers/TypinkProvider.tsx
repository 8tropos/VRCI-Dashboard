// src/providers/TypinkProvider.tsx

'use client';

import { ReactNode } from 'react';
import { TypinkProvider as BaseTypinkProvider } from 'typink';

// Determine environment
const isDevelopment = process.env.NODE_ENV === 'development';

// RPC URL based on environment (static keys for Next.js build-time replacement)
const RPC_URL = isDevelopment
  ? (process.env.NEXT_PUBLIC_RPC_URL_DEV || process.env.NEXT_PUBLIC_RPC_URL || '')
  : (process.env.NEXT_PUBLIC_RPC_URL || '');

// Passet Hub Testnet Configuration (supports ink! v6 contracts)
const PASSET_HUB_NETWORK = {
  id: "passet_hub_testnet",
  name: "Passet Hub Testnet",
  rpc: RPC_URL,
  chainId: 420420422,
  decimals: 10,
  symbol: "PAS",
  logo: "https://parachains.info/images/parachains/1688559044_assethub.svg",
  pjsUrl: "https://blockscout-passet-hub.parity-testnet.parity.io",
  faucetUrl: "https://faucet.passet-hub.parity-testnet.parity.io",
  providers: [RPC_URL]
};

// Contract addresses on Passet Hub Testnet (actual deployed addresses)
const CONTRACT_ADDRESSES = {
  TOKEN: isDevelopment
    ? (process.env.NEXT_PUBLIC_TOKEN_ADDRESS_DEV || process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '')
    : (process.env.NEXT_PUBLIC_TOKEN_ADDRESS || ''),
  ORACLE: isDevelopment
    ? (process.env.NEXT_PUBLIC_ORACLE_ADDRESS_DEV || process.env.NEXT_PUBLIC_ORACLE_ADDRESS || '')
    : (process.env.NEXT_PUBLIC_ORACLE_ADDRESS || ''),
  REGISTRY: isDevelopment
    ? (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS_DEV || process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '')
    : (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || ''),
  PORTFOLIO: isDevelopment
    ? (process.env.NEXT_PUBLIC_PORTFOLIO_ADDRESS_DEV || process.env.NEXT_PUBLIC_PORTFOLIO_ADDRESS || '')
    : (process.env.NEXT_PUBLIC_PORTFOLIO_ADDRESS || ''),
  STAKING: isDevelopment
    ? (process.env.NEXT_PUBLIC_STAKING_ADDRESS_DEV || process.env.NEXT_PUBLIC_STAKING_ADDRESS || '')
    : (process.env.NEXT_PUBLIC_STAKING_ADDRESS || ''),
  DEX: isDevelopment
    ? (process.env.NEXT_PUBLIC_DEX_ADDRESS_DEV || process.env.NEXT_PUBLIC_DEX_ADDRESS || '')
    : (process.env.NEXT_PUBLIC_DEX_ADDRESS || '')
};

// Import contract metadata for TypinkProvider
import tokenMetadata from '@/contracts/metadata/token.json';
import oracleMetadata from '@/contracts/metadata/oracle.json';
import registryMetadata from '@/contracts/metadata/registry.json';
import portfolioMetadata from '@/contracts/metadata/portfolio.json';
import stakingMetadata from '@/contracts/metadata/staking.json';
import dexMetadata from '@/contracts/metadata/dex.json';

// Contract deployments configuration using new Typink system
const deployments = [
  {
    id: 'token',
    network: 'passet_hub_testnet',
    address: CONTRACT_ADDRESSES.TOKEN,
    metadata: tokenMetadata
  },
  {
    id: 'oracle',
    network: 'passet_hub_testnet',
    address: CONTRACT_ADDRESSES.ORACLE,
    metadata: oracleMetadata
  },
  {
    id: 'registry',
    network: 'passet_hub_testnet',
    address: CONTRACT_ADDRESSES.REGISTRY,
    metadata: registryMetadata
  },
  {
    id: 'portfolio',
    network: 'passet_hub_testnet',
    address: CONTRACT_ADDRESSES.PORTFOLIO,
    metadata: portfolioMetadata
  },
  {
    id: 'staking',
    network: 'passet_hub_testnet',
    address: CONTRACT_ADDRESSES.STAKING,
    metadata: stakingMetadata
  },
  {
    id: 'dex',
    network: 'passet_hub_testnet',
    address: CONTRACT_ADDRESSES.DEX,
    metadata: dexMetadata
  }
];

const supportedNetworks = [PASSET_HUB_NETWORK];

interface TypinkProviderProps {
  children: ReactNode;
}

export function TypinkProvider({ children }: TypinkProviderProps) {
  return (
    <BaseTypinkProvider
      appName="W3PI - Web3 Portfolio Intelligence"
      deployments={deployments}
      defaultNetworkId="passet_hub_testnet"
      supportedNetworks={supportedNetworks}
      defaultCaller="5FAAUGRrj9AFCYKFKZjS3fUMh4ntZFVrRvDTX2NjcQRr15da" // My account for testing
    >
      {children}
    </BaseTypinkProvider>
  );
}

// Export contract addresses and configurations for use in components
export { CONTRACT_ADDRESSES, PASSET_HUB_NETWORK, deployments, supportedNetworks };
