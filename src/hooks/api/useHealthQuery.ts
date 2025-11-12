import { useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '@/lib/api/types';

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  services: {
    api: 'up' | 'down';
    database: 'up' | 'down';
    polkadot: 'up' | 'down';
  };
  uptime: number;
}

/**
 * Hook to fetch system health status
 */
export function useHealthQuery() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async (): Promise<HealthData> => {
      const res = await fetch('/api/health');
      const data: ApiResponse<HealthData> = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch health status');
      }
      
      if (!data.data) {
        throw new Error('No health data found');
      }
      
      return data.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchOnWindowFocus: true,
  });
}

