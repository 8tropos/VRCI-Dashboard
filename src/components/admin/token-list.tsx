'use client';

import { useTokens, useDeleteToken, type Token } from '@/hooks/api/useTokens';
import { useOracleQuery } from '@/hooks/api/useOracleQuery';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, RefreshCw, Loader2, TrendingUp, TrendingDown, DollarSign, BarChart3, Coins } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(8)}`;
}

interface TokenRowProps {
  token: Token;
  oracleData?: {
    price: number;
    marketCap: number | null;
    volume24h: number | null;
    ath: number | null;
    atl: number | null;
    supply: number | null;
    source: string;
  };
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function TokenRow({ token, oracleData, onDelete, isDeleting }: TokenRowProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{token.symbol}</h3>
            <Badge variant={token.enabled ? 'default' : 'secondary'}>
              {token.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
            {oracleData && (
              <Badge variant="outline" className="text-xs">
                {oracleData.source}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{token.name}</p>
          {token.description && (
            <p className="text-xs text-muted-foreground mt-1">{token.description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(token.id)}
          disabled={isDeleting}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {oracleData ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t">
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
              Price
            </div>
            <div className="font-semibold">{formatPrice(oracleData.price)}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <BarChart3 className="h-3 w-3" />
              Market Cap
            </div>
            <div className="font-semibold text-sm">{formatNumber(oracleData.marketCap)}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              24h Volume
            </div>
            <div className="font-semibold text-sm">{formatNumber(oracleData.volume24h)}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              ATH
            </div>
            <div className="font-semibold text-sm">
              {oracleData.ath !== null && oracleData.ath !== undefined ? formatPrice(oracleData.ath) : 'N/A'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingDown className="h-3 w-3" />
              ATL
            </div>
            <div className="font-semibold text-sm">
              {oracleData.atl !== null && oracleData.atl !== undefined ? formatPrice(oracleData.atl) : 'N/A'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Coins className="h-3 w-3" />
              Supply
            </div>
            <div className="font-semibold text-sm">{formatNumber(oracleData.supply)}</div>
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Oracle data...
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground pt-2 border-t">
        Added {formatDistanceToNow(new Date(token.createdAt), { addSuffix: true })}
      </div>
    </div>
  );
}

export function TokenList() {
  const { data: tokens, isLoading, error, refetch } = useTokens();
  const deleteToken = useDeleteToken();

  // Get all enabled token symbols
  const enabledSymbols = tokens?.filter((t) => t.enabled).map((t) => t.symbol) || [];
  
  // Fetch Oracle data for all enabled tokens
  const { data: oracleData, isLoading: oracleLoading, refetch: refetchOracle } = useOracleQuery(
    enabledSymbols,
    {
      enabled: enabledSymbols.length > 0,
      staleTime: 60 * 1000, // 60 seconds
    }
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this token?')) return;
    
    try {
      await deleteToken.mutateAsync(id);
    } catch (err) {
      console.error('Failed to delete token:', err);
    }
  };

  const handleRefresh = () => {
    refetch();
    refetchOracle();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading tokens...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load tokens: {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!tokens || tokens.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <p>No tokens found. Add your first token to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Token List ({tokens.length})
            </CardTitle>
            <CardDescription>
              Manage tokens and view live Oracle data from CoinMarketCap
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={oracleLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${oracleLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tokens.map((token) => (
            <TokenRow
              key={token.id}
              token={token}
              oracleData={oracleData?.[token.symbol]}
              onDelete={handleDelete}
              isDeleting={deleteToken.isPending}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
