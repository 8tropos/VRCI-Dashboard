"use client";

import { useMemo } from "react";
import { ClientOnly } from "@/components/client-only";
import {
  AddressInputBase,
  type AddressInputBaseProps,
} from "./address-input.base";
// Import Dedot-specific hooks
// PolkadotProvider import removed - using TypinkProvider at app level
import { useIdentityOf } from "@/hooks/use-identity-of.dedot";
import { useIdentitySearch } from "@/hooks/use-search-identity.dedot";
import { type NetworkId, paseoPeople, usePolkadotClient } from "typink";
import { Input } from "@/components/ui/input";

export type AddressInputProps = Omit<
  AddressInputBaseProps<NetworkId>,
  "services"
>;

export function AddressInput(props: AddressInputProps) {
  return (
    <ClientOnly fallback={<Input onChange={() => {}} />}>
      <AddressInputInner {...props} />
    </ClientOnly>
  );
}

function AddressInputInner(props: AddressInputProps) {
  const { status } = usePolkadotClient(props.identityChain ?? paseoPeople.id);

  const services = useMemo(
    () => ({
      useIdentityOf: (address: string, identityChain?: NetworkId) =>
        useIdentityOf({ address, chainId: identityChain ?? paseoPeople.id }),
      useIdentitySearch,
      clientStatus: status,
      explorerUrl: "",
    }),
    [status]
  );

  return (
    <AddressInputBase
      {...props}
      services={services}
      identityChain={props.identityChain ?? paseoPeople.id}
    />
  );
}

// Wrapped version with provider for drop-in usage
// AddressInputWithProvider is no longer needed since TypinkProvider is at app level
export function AddressInputWithProvider(props: AddressInputProps) {
  return <AddressInput {...props} />;
}

AddressInputWithProvider.displayName = "AddressInputWithProvider";
