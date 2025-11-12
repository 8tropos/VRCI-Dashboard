import { useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '@/lib/api/types';

interface StateQueryOptions {
  type?: 'wallets' | 'logs';
  walletId?: string;
  contract?: string;
  enabled?: boolean;
}

/**
 * Hook to fetch off-chain state (wallets, logs, etc.)
 */
export function useStateQuery(options: StateQueryOptions = {}) {
  const { type = 'wallets', walletId, contract, enabled = true } = options;

  return useQuery({
    queryKey: ['state', type, walletId, contract],
    queryFn: async (): Promise<unknown> => {
      const params = new URLSearchParams();
      params.set('type', type);
      if (walletId) params.set('walletId', walletId);
      if (contract) params.set('contract', contract);

      const res = await fetch(`/api/state?${params.toString()}`);
      const data: ApiResponse<unknown> = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch state');
      }
      
      return data.data;
    },
    enabled,
    staleTime: 10 * 1000, // 10 seconds
    refetchOnWindowFocus: true,
  });
}

