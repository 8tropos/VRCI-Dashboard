'use client';

import { ReactNode } from 'react';
import { TypinkProvider } from 'typink';
import { deployments, PASSET_HUB_NETWORK } from '@/providers/TypinkProvider';

interface TypinkWrapperProps {
  children: ReactNode;
}

export default function TypinkWrapper({ children }: TypinkWrapperProps) {
  return (
    <TypinkProvider
      appName="W3PI - Web3 Portfolio Intelligence"
      deployments={deployments}
      supportedNetworks={[PASSET_HUB_NETWORK]}
      defaultNetworkId="passet_hub_testnet"
      cacheMetadata={true}
      defaultCaller="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
    >
      {children}
    </TypinkProvider>
  );
}
