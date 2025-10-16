// src/providers/TypinkProvider.tsx

'use client';

import { ReactNode } from 'react';
import { TypinkProvider as BaseTypinkProvider } from 'typink';

// Passet Hub Testnet Configuration
const PASSET_HUB_NETWORK = {
  id: "passet_hub_testnet",
  name: "Passet Hub Testnet",
  rpc: "wss://passet-hub-paseo.ibp.network",
  chainId: 420420422,
  decimals: 10,
  symbol: "PAS",
  logo: "https://raw.githubusercontent.com/dedotdev/typink/main/assets/networks/passet-hub.svg",
  pjsUrl: "https://blockscout-passet-hub.parity-testnet.parity.io",
  faucetUrl: "https://faucet.passet-hub.parity-testnet.parity.io",
  providers: ["wss://passet-hub-paseo.ibp.network"]
};

// Contract addresses on Passet Hub Testnet
const CONTRACT_ADDRESSES = {
  TOKEN: '0xf830b0c05889cbd05b13bf87bee1ca52755aafe8',
  ORACLE: '0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac',
  REGISTRY: '0xa85587de037304d67fa88f5d23c1d4b820e0d4bf',
  PORTFOLIO: '0xc9e68f98cb0dc6d3065fe89622026ea062dc7513',
  STAKING: '0x02a76f98f814455a7d5c89f86f23c557c27de89c',
  DEX: '0x5e0631f14dd2920bb582dd0ba6daf92f76ec4894'
};

// Import contract metadata
import tokenMetadata from '@/contracts/artifacts/token/token.json';
import oracleMetadata from '@/contracts/artifacts/oracle/oracle.json';
import registryMetadata from '@/contracts/artifacts/registry/registry.json';

// Contract deployments configuration
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
  }
  // Note: Portfolio, Staking, and DEX contracts will be added when their metadata is available
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
      defaultCaller="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY" // Alice for testing
    >
      {children}
    </BaseTypinkProvider>
  );
}

// Export contract addresses for use in components
export { CONTRACT_ADDRESSES, PASSET_HUB_NETWORK };
