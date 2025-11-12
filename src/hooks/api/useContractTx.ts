import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@/lib/api/types';
import type { ContractTxRequest } from '@/lib/api/types';

/**
 * Hook to execute a contract transaction (write operation)
 * Includes optimistic updates and query invalidation
 */
export function useContractTx(contractName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ContractTxRequest): Promise<unknown> => {
      const res = await fetch(`/api/contracts/${contractName}/tx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: ApiResponse<{ txHash?: string; extrinsic?: unknown }> = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to execute contract transaction');
      }
      
      return data.data;
    },
    onSuccess: () => {
      // Invalidate related queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['contracts', contractName] });
      queryClient.invalidateQueries({ queryKey: ['state'] });
    },
    onError: (error) => {
      console.error('Contract transaction failed:', error);
    },
  });
}

/**
 * Hook with optimistic updates example
 */
export function useContractTxOptimistic(contractName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ContractTxRequest): Promise<unknown> => {
      const res = await fetch(`/api/contracts/${contractName}/tx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: ApiResponse<{ txHash?: string; extrinsic?: unknown }> = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to execute contract transaction');
      }
      
      return data.data;
    },
    // Optimistic update: update cache before the mutation completes
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['contracts', contractName] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['contracts', contractName]);

      // Optimistically update the cache
      // This is a placeholder - adjust based on your actual data structure
      queryClient.setQueryData(['contracts', contractName], (old: unknown) => {
        // Return optimistically updated data
        return old;
      });

      // Return context with the previous value
      return { previousData };
    },
    // If the mutation fails, roll back to the previous value
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['contracts', contractName], context.previousData);
      }
      console.error('Contract transaction failed:', error);
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', contractName] });
      queryClient.invalidateQueries({ queryKey: ['state'] });
    },
  });
}

