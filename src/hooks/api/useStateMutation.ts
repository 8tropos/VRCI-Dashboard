import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@/lib/api/types';

interface CreateWalletRequest {
  type: 'wallet';
  address: string;
  chainId?: string;
}

interface CreateLogRequest {
  type: 'log';
  walletId: string;
  contract: string;
  method: string;
  txHash?: string;
  status: 'pending' | 'success' | 'failed';
  data?: Record<string, unknown>;
}

type StateMutationRequest = CreateWalletRequest | CreateLogRequest;

/**
 * Hook to create/update off-chain state (wallets, logs, etc.)
 */
export function useStateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: StateMutationRequest): Promise<unknown> => {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: ApiResponse<unknown> = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create state');
      }
      
      return data.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries based on the mutation type
      if (variables.type === 'wallet') {
        queryClient.invalidateQueries({ queryKey: ['state', 'wallets'] });
      } else if (variables.type === 'log') {
        queryClient.invalidateQueries({ queryKey: ['state', 'logs'] });
        if ('walletId' in variables) {
          queryClient.invalidateQueries({ 
            queryKey: ['state', 'logs', variables.walletId] 
          });
        }
      }
    },
  });
}

