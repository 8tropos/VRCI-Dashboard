// src/providers/TypinkProvider.tsx

'use client';

import { ReactNode } from 'react';
import { TypinkProvider as BaseTypinkProvider } from 'typink';

// Passet Hub Testnet Configuration (supports ink! v6 contracts)
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

// Contract addresses on Passet Hub Testnet (actual deployed addresses)
const CONTRACT_ADDRESSES = {
  TOKEN: '0x873091e24278a4adb6a5fcf7c8a99b9c31179cc0', // Your deployed token contract
  ORACLE: '0x0000000000000000000000000000000000000002', // To be deployed
  REGISTRY: '0x0000000000000000000000000000000000000003', // To be deployed
  PORTFOLIO: '0x0000000000000000000000000000000000000004', // To be deployed
  STAKING: '0x0000000000000000000000000000000000000005', // To be deployed
  DEX: '0x0000000000000000000000000000000000000006' // To be deployed
};

// Import contract metadata for TypinkProvider
import tokenMetadata from '@/contracts/metadata/token.json';
import oracleMetadata from '@/contracts/metadata/oracle.json';
import registryMetadata from '@/contracts/metadata/registry.json';

// Import new Typink-generated contract APIs for type safety
import type { TokenContractApi } from '@/lib/contracts/token';
import type { OracleContractApi } from '@/lib/contracts/oracle';
import type { RegistryContractApi } from '@/lib/contracts/registry';

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
  }
  // Note: Portfolio, Staking, and DEX contracts will be added when deployed
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
