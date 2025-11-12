import { useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '@/lib/api/types';
import type { ContractCallRequest } from '@/lib/api/types';

/**
 * Hook to call a contract method (read operation)
 */
export function useContractCall(
  contractName: string | null,
  request: ContractCallRequest | null,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  return useQuery({
    queryKey: ['contracts', contractName, 'call', request],
    queryFn: async (): Promise<unknown> => {
      if (!contractName || !request) {
        throw new Error('Contract name and request are required');
      }

      const res = await fetch(`/api/contracts/${contractName}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: ApiResponse<unknown> = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to call contract method');
      }
      
      return data.data;
    },
    enabled: !!contractName && !!request && (options?.enabled !== false),
    staleTime: options?.staleTime ?? 30 * 1000, // 30 seconds default
    refetchOnWindowFocus: false,
  });
}

