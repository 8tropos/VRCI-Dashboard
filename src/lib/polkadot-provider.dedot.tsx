"use client";

import {
  type ContractDeployment,
  type NetworkId,
  type NetworkInfo,
  paseo,
  paseoAssetHub,
  paseoPeople,
  polkadot,
  polkadotAssetHub,
  polkadotPeople,
  TypinkProvider,
} from "typink";
import { PASSET_HUB_NETWORK, CONTRACT_ADDRESSES } from '@/providers/TypinkProvider';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import tokenMetadata from '@/contracts/metadata/token.json';
import oracleMetadata from '@/contracts/metadata/oracle.json';
import registryMetadata from '@/contracts/metadata/registry.json';

export const SUPPORTED_NETWORKS = [
  PASSET_HUB_NETWORK,
  paseo,
  paseoAssetHub,
  paseoPeople,
  polkadot,
  polkadotAssetHub,
  polkadotPeople,
];

const queryClient = new QueryClient();

// Contract deployments for Passet Hub Testnet
const deployments: ContractDeployment[] = [
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
];

export function PolkadotProvider({
  children,
  appName = "W3PI Dashboard",
  defaultCaller = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  supportedNetworks = SUPPORTED_NETWORKS,
  deployments: customDeployments = deployments,
}: {
  children: React.ReactNode;
  appName?: string;
  defaultCaller?: string;
  defaultNetworkId?: NetworkId;
  deployments?: ContractDeployment[];
  supportedNetworks?: NetworkInfo[];
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <TypinkProvider
        appName={appName}
        defaultCaller={defaultCaller}
        supportedNetworks={supportedNetworks}
        defaultNetworkIds={['passet_hub_testnet']}
        deployments={customDeployments}
        cacheMetadata={true}
      >
        {children}
      </TypinkProvider>
    </QueryClientProvider>
  );
}
