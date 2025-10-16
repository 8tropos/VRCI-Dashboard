// src/providers/TypinkProvider.tsx

'use client';

import { ReactNode } from 'react';
import { TypinkProvider as BaseTypinkProvider } from 'typink';

// Paseo Testnet Configuration (supports ink! contracts)
const PASEO_NETWORK = {
  id: "paseo_testnet",
  name: "Paseo Testnet",
  rpc: "wss://paseo-rpc.polkadot.io",
  chainId: 0,
  decimals: 10,
  symbol: "PAS",
  logo: "https://raw.githubusercontent.com/dedotdev/typink/main/assets/networks/paseo.svg",
  pjsUrl: "https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fpaseo-rpc.polkadot.io",
  faucetUrl: "https://faucet.polkadot.io",
  providers: ["wss://paseo-rpc.polkadot.io"]
};

// Contract addresses on Paseo Testnet (dummy addresses for testing)
const CONTRACT_ADDRESSES = {
  TOKEN: '0x0000000000000000000000000000000000000001',
  ORACLE: '0x0000000000000000000000000000000000000002',
  REGISTRY: '0x0000000000000000000000000000000000000003',
  PORTFOLIO: '0x0000000000000000000000000000000000000004',
  STAKING: '0x0000000000000000000000000000000000000005',
  DEX: '0x0000000000000000000000000000000000000006'
};

// Import contract metadata
import tokenMetadata from '@/contracts/artifacts/token/token.json';
import oracleMetadata from '@/contracts/artifacts/oracle/oracle.json';
import registryMetadata from '@/contracts/artifacts/registry/registry.json';

// Contract deployments configuration
const deployments = [
  {
    id: 'token',
    network: 'paseo_testnet',
    address: CONTRACT_ADDRESSES.TOKEN,
    metadata: tokenMetadata
  },
  {
    id: 'oracle',
    network: 'paseo_testnet', 
    address: CONTRACT_ADDRESSES.ORACLE,
    metadata: oracleMetadata
  },
  {
    id: 'registry',
    network: 'paseo_testnet',
    address: CONTRACT_ADDRESSES.REGISTRY,
    metadata: registryMetadata
  }
  // Note: Portfolio, Staking, and DEX contracts will be added when their metadata is available
];

const supportedNetworks = [PASEO_NETWORK];

interface TypinkProviderProps {
  children: ReactNode;
}

export function TypinkProvider({ children }: TypinkProviderProps) {
  return (
            <BaseTypinkProvider
              appName="W3PI - Web3 Portfolio Intelligence"
              deployments={deployments}
              defaultNetworkId="paseo_testnet"
              supportedNetworks={supportedNetworks}
              defaultCaller="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY" // Alice for testing
            >
      {children}
    </BaseTypinkProvider>
  );
}

// Export contract addresses for use in components
export { CONTRACT_ADDRESSES, PASEO_NETWORK };
