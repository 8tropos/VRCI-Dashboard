import { useQuery } from '@tanstack/react-query';
import type { ApiResponse, ContractMetadata } from '@/lib/api/types';

/**
 * Hook to fetch contract methods and metadata
 */
export function useContractMethods(contractName: string | null) {
  return useQuery({
    queryKey: ['contracts', contractName, 'methods'],
    queryFn: async (): Promise<ContractMetadata> => {
      if (!contractName) {
        throw new Error('Contract name is required');
      }

      const res = await fetch(`/api/contracts/${contractName}/methods`);
      const data: ApiResponse<ContractMetadata> = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch contract methods');
      }
      
      if (!data.data) {
        throw new Error('No contract metadata found');
      }
      
      return data.data;
    },
    enabled: !!contractName,
    staleTime: 10 * 60 * 1000, // 10 minutes (metadata rarely changes)
    refetchOnWindowFocus: false,
  });
}

