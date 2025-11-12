import { useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '@/lib/api/types';

/**
 * Hook to fetch all available contracts
 */
export function useContractsQuery() {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: async (): Promise<string[]> => {
      const res = await fetch('/api/contracts');
      const data: ApiResponse<string[]> = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch contracts');
      }
      
      return data.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

