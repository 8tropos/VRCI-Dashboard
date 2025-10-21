"use client";

import {
  ConnectWalletBase,
  type ConnectWalletBaseProps,
} from "./connect-wallet.base";
import { useTypink } from "typink";

export type ConnectWalletProps = Omit<ConnectWalletBaseProps, "services">;

export function ConnectWallet(props: ConnectWalletProps) {
  const {
    accounts,
    wallets,
    connectedWallets,
    connectedAccount,
    connectWallet,
    disconnect,
    setConnectedAccount,
  } = useTypink();

  return (
    <ConnectWalletBase
      {...props}
      services={{
        accounts,
        wallets,
        connectedWallets,
        connectedAccount,
        connectWallet,
        disconnect,
        setConnectedAccount,
      }}
    />
  );
}

// ConnectWalletWithProvider is no longer needed since TypinkProvider is at app level
export function ConnectWalletWithProvider(props: ConnectWalletProps) {
  return <ConnectWallet {...props} />;
}
