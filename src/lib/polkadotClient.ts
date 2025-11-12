import { ApiPromise, WsProvider } from '@polkadot/api';

let api: ApiPromise | null = null;

export interface PolkadotClientConfig {
  rpcUrl?: string;
}

/**
 * Get or create a Polkadot API client instance
 * Uses singleton pattern to reuse connection
 */
export const getPolkadotClient = async (config?: PolkadotClientConfig): Promise<ApiPromise> => {
  if (api) return api;

  const rpcUrl = config?.rpcUrl || process.env.NEXT_PUBLIC_RPC_URL || 'wss://rpc.polkadot.io';
  
  const provider = new WsProvider(rpcUrl);
  api = await ApiPromise.create({ provider });

  return api;
};

/**
 * Disconnect the Polkadot client
 */
export const disconnectPolkadotClient = async (): Promise<void> => {
  if (api) {
    await api.disconnect();
    api = null;
  }
};

