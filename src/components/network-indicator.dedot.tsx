"use client";

import { ClientOnly } from "@/components/client-only";
import {
  NetworkIndicatorBase,
  NetworkIndicatorSkeleton,
  type NetworkIndicatorBaseProps,
} from "./network-indicator.base";
// PolkadotProvider import removed - using TypinkProvider at app level
import { useMemo } from "react";
import { ClientConnectionStatus, useBlockInfo, useTypink } from "typink";

export type NetworkIndicatorProps<TNetworkId extends string> = Omit<
  NetworkIndicatorBaseProps<TNetworkId>,
  "services"
>;

export function NetworkIndicator<TNetworkId extends string>(
  props: NetworkIndicatorProps<TNetworkId>
) {
  return (
    <ClientOnly fallback={<NetworkIndicatorSkeleton />}>
      <NetworkIndicatorInner {...props} />
    </ClientOnly>
  );
}

export function NetworkIndicatorInner<TNetworkId extends string>(
  props: NetworkIndicatorProps<TNetworkId>
) {
  const { chainId } = props;
  const { connectionStatus, supportedNetworks } = useTypink();
  const { best, finalized } = useBlockInfo({ networkId: chainId });

  const services = useMemo(
    () => ({
      connectionStatus:
        connectionStatus.get(chainId) ?? ClientConnectionStatus.NotConnected,
      supportedNetworks,
      blockInfo: { best, finalized },
    }),
    [connectionStatus, supportedNetworks, best, finalized, chainId]
  );

  return <NetworkIndicatorBase {...props} services={services} />;
}

// NetworkIndicatorWithProvider is no longer needed since TypinkProvider is at app level
export function NetworkIndicatorWithProvider(
  props: NetworkIndicatorProps<string>
) {
  return <NetworkIndicator {...props} />;
}
