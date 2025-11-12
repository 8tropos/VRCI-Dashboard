import { useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '@/lib/api/types';
import type { OracleTokenData } from '@/lib/api/oracle-schemas';

/**
 * Hook to fetch live token data from Oracle API
 * 
 * @param symbols - Array of token symbols to fetch (e.g., ['BTC', 'ETH', 'DOT'])
 * @param options - Additional query options
 */
export function useOracleQuery(
  symbols: string[],
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  const uniqueSymbols = [...new Set(symbols.map((s) => s.toUpperCase()))];
  const symbolsKey = uniqueSymbols.sort().join(',');

  return useQuery({
    queryKey: ['oracle', symbolsKey],
    queryFn: async (): Promise<Record<string, OracleTokenData>> => {
      if (uniqueSymbols.length === 0) {
        throw new Error('At least one symbol is required');
      }

      const symbolsParam = uniqueSymbols.join(',');
      const res = await fetch(`/api/oracle?symbols=${encodeURIComponent(symbolsParam)}`);
      
      const data: ApiResponse<Record<string, OracleTokenData>> = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch oracle data');
      }
      
      if (!data.data) {
        throw new Error('No token data returned');
      }
      
      return data.data;
    },
    enabled: (options?.enabled !== false) && uniqueSymbols.length > 0,
    staleTime: options?.staleTime ?? 60 * 1000, // 60 seconds default
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Hook to fetch a single token's data
 * 
 * @param symbol - Single token symbol (e.g., 'BTC')
 * @param options - Additional query options
 */
export function useOracleTokenQuery(
  symbol: string | null,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  const query = useOracleQuery(symbol ? [symbol] : [], options);

  return {
    ...query,
    data: symbol ? query.data?.[symbol.toUpperCase()] : undefined,
  };
}

