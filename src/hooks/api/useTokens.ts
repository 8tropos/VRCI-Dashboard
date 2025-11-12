import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@/lib/api/types';

export interface Token {
  id: string;
  symbol: string;
  name: string;
  description: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTokenInput {
  symbol: string;
  name: string;
  description?: string;
  enabled?: boolean;
}

export interface UpdateTokenInput {
  name?: string;
  description?: string;
  enabled?: boolean;
}

/**
 * Hook to fetch all tokens
 */
export function useTokens() {
  return useQuery({
    queryKey: ['tokens'],
    queryFn: async (): Promise<Token[]> => {
      const res = await fetch('/api/tokens');
      const data: ApiResponse<Token[]> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch tokens');
      }

      return data.data || [];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to create a new token
 */
export function useCreateToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTokenInput): Promise<Token> => {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data: ApiResponse<Token> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create token');
      }

      return data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
    },
  });
}

/**
 * Hook to update a token
 */
export function useUpdateToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateTokenInput }): Promise<Token> => {
      const res = await fetch(`/api/tokens/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data: ApiResponse<Token> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update token');
      }

      return data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
    },
  });
}

/**
 * Hook to delete a token
 */
export function useDeleteToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/tokens/${id}`, {
        method: 'DELETE',
      });

      const data: ApiResponse<unknown> = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete token');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
    },
  });
}

