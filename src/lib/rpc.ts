const DEFAULT_RPC_URL = 'wss://testnet-passet-hub.polkadot.io';
const ARCHIVE_RPC_URL = 'wss://passet-hub-paseo.ibp.network';

const DEPRECATED_POP_RPC_URLS = new Set([
  'wss://rpc1.paseo.popnetwork.xyz',
  'wss://rpc1.paseo.popnetwork.xyz/',
  'wss://rpc2.paseo.popnetwork.xyz',
  'wss://rpc2.paseo.popnetwork.xyz/',
]);

function normalizeRpcUrl(candidate: string): string {
  return DEPRECATED_POP_RPC_URLS.has(candidate) ? DEFAULT_RPC_URL : candidate;
}

function findConfiguredRpcUrl(candidates: Array<string | null | undefined>): string | undefined {
  for (const candidate of candidates) {
    const value = candidate?.trim();

    if (value) {
      return normalizeRpcUrl(value);
    }
  }

  return undefined;
}

/**
 * Normalize old repo defaults to the current Passet Hub websocket endpoint.
 * This keeps stale .env values from breaking local development outright.
 */
export function getRpcUrl(...candidates: Array<string | null | undefined>): string {
  return getRpcProviderUrls(...candidates)[0];
}

export function getRpcProviderUrls(...candidates: Array<string | null | undefined>): string[] {
  const configuredUrl = findConfiguredRpcUrl(candidates);

  if (!configuredUrl) {
    return [DEFAULT_RPC_URL, ARCHIVE_RPC_URL];
  }

  if (configuredUrl === DEFAULT_RPC_URL) {
    return [DEFAULT_RPC_URL, ARCHIVE_RPC_URL];
  }

  if (configuredUrl === ARCHIVE_RPC_URL || configuredUrl === `${ARCHIVE_RPC_URL}/`) {
    return [ARCHIVE_RPC_URL, DEFAULT_RPC_URL];
  }

  return [configuredUrl];
}

export { ARCHIVE_RPC_URL, DEFAULT_RPC_URL };
