'use client';

import { useTokens, useDeleteToken, type Token } from '@/hooks/api/useTokens';
import { useOracleQuery } from '@/hooks/api/useOracleQuery';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, RefreshCw, Loader2, Table2 } from 'lucide-react';
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

export function TokenTable() {
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
              <Table2 className="h-5 w-5" />
              Token Table ({tokens.length})
            </CardTitle>
            <CardDescription>
              View all tokens from database with Oracle data
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={oracleLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${oracleLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TOKEN</TableHead>
                <TableHead className="text-right">PRICE</TableHead>
                <TableHead className="text-right">ALL TIME HIGH</TableHead>
                <TableHead className="text-right">MARKET CAP</TableHead>
                <TableHead className="text-right">TRADING VOLUME</TableHead>
                <TableHead className="text-right">SUPPLY</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>SOURCE</TableHead>
                <TableHead>CREATED</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((token) => {
                const oracle = oracleData?.[token.symbol];
                return (
                  <TableRow key={token.id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{token.symbol}</div>
                        <div className="text-xs text-muted-foreground">{token.name}</div>
                        {token.description && (
                          <div className="text-xs text-muted-foreground mt-1">{token.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {oracle ? (
                        <div className="font-semibold">{formatPrice(oracle.price)}</div>
                      ) : (
                        <div className="text-muted-foreground text-sm">Loading...</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {oracle ? (
                        <div className="font-semibold">
                          {oracle.ath !== null && oracle.ath !== undefined ? formatPrice(oracle.ath) : 'N/A'}
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-sm">Loading...</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {oracle ? (
                        <div className="font-semibold text-sm">{formatNumber(oracle.marketCap)}</div>
                      ) : (
                        <div className="text-muted-foreground text-sm">Loading...</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {oracle ? (
                        <div className="font-semibold text-sm">{formatNumber(oracle.volume24h)}</div>
                      ) : (
                        <div className="text-muted-foreground text-sm">Loading...</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {oracle ? (
                        <div className="font-semibold text-sm">{formatNumber(oracle.supply)}</div>
                      ) : (
                        <div className="text-muted-foreground text-sm">Loading...</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={token.enabled ? 'default' : 'secondary'}>
                        {token.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {oracle && (
                        <Badge variant="outline" className="text-xs">
                          {oracle.source}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(token.createdAt), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(token.id)}
                        disabled={deleteToken.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

