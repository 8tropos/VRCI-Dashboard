'use client';

import { useEffect, useState } from 'react';
import { useContract, useContractQuery } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle, XCircle, Info, TrendingUp, Wallet, Clock,
  AlertTriangle, Activity, Layers, BarChart3
} from 'lucide-react';

export default function PortfolioOverview() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');

  const totalTokensQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getTotalTokensHeld',
  });

  const heldTokenIdsQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getHeldTokenIds',
  });

  const stateQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getState',
  });

  const emergencyPausedQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'isEmergencyPaused',
  });

  const portfolioStatsQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getPortfolioStats',
  });

  const indexValueQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getCurrentIndexValue',
  });

  const feeConfigQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getFeeConfig',
  });

  const feesCollectedQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getTotalFeesCollected',
  });

  const isLoading = totalTokensQuery.isLoading || stateQuery.isLoading;

  const state = stateQuery.data ?? 'Unknown';
  const isEmergencyPaused = emergencyPausedQuery.data ?? false;
  const totalTokens = totalTokensQuery.data ?? 0;
  const tokenIds = heldTokenIdsQuery.data ?? [];
  const indexValue = indexValueQuery.data ?? 0n;
  const feesCollected = feesCollectedQuery.data ?? 0n;

  // portfolioStats returns [total, active, max]
  const stats = portfolioStatsQuery.data;
  const activeTokens = stats?.[1] ?? 0;
  const maxTokens = stats?.[2] ?? 0;

  const feeConfig = feeConfigQuery.data;

  const formatValue = (value: bigint): string => {
    const num = Number(value) / 1e18;
    return `$${num.toFixed(4)}`;
  };

  const formatFee = (bp: number): string => `${(bp / 100).toFixed(2)}%`;

  const getStateStyle = (s: string) => {
    switch (s) {
      case 'Active': return { color: 'text-green-600', bg: 'bg-green-50', icon: Activity };
      case 'Paused': return { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock };
      case 'Maintenance': return { color: 'text-blue-600', bg: 'bg-blue-50', icon: Info };
      case 'Emergency': return { color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle };
      default: return { color: 'text-gray-600', bg: 'bg-gray-50', icon: Info };
    }
  };

  const stateStyle = getStateStyle(state);
  const StateIcon = stateStyle.icon;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Portfolio Overview
          </CardTitle>
          <CardDescription>
            Current portfolio status and key metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Portfolio State */}
              <div className={`space-y-2 p-4 rounded-lg ${stateStyle.bg}`}>
                <div className="flex items-center gap-2">
                  <StateIcon className={`h-4 w-4 ${stateStyle.color}`} />
                  <span className="font-medium">State</span>
                  {isEmergencyPaused && (
                    <Badge variant="destructive" className="text-xs">Emergency</Badge>
                  )}
                </div>
                <div className={`text-2xl font-bold ${stateStyle.color}`}>
                  {isEmergencyPaused ? 'Emergency Pause' : state}
                </div>
                <p className="text-sm text-gray-600">Portfolio operational state</p>
              </div>

              {/* Total Tokens Held */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Total Tokens</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {totalTokens}
                  {maxTokens > 0 && (
                    <span className="text-sm font-normal text-gray-500 ml-1">/ {maxTokens} max</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {activeTokens > 0 ? `${activeTokens} actively tracked` : 'Tokens in portfolio'}
                </p>
              </div>

              {/* Current Index Value */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Index Value</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {indexValue > 0n ? formatValue(indexValue) : 'N/A'}
                </div>
                <p className="text-sm text-gray-600">Current W3PI index value</p>
              </div>

              {/* Fees Collected */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Fees Collected</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatValue(feesCollected)}
                </div>
                <p className="text-sm text-gray-600">Total protocol fees</p>
              </div>

              {/* Buy Fee */}
              {feeConfig && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Buy / Sell Fee</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatFee(feeConfig.buyFeeBp)} / {formatFee(feeConfig.sellFeeBp)}
                  </div>
                  <p className="text-sm text-gray-600">
                    Streaming: {formatFee(feeConfig.streamingFeeBp)}/yr
                  </p>
                </div>
              )}

              {/* Token IDs */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-teal-600" />
                  <span className="font-medium">Held Token IDs</span>
                </div>
                <div className="text-sm font-mono text-gray-700">
                  {tokenIds.length > 0
                    ? tokenIds.slice(0, 8).join(', ') + (tokenIds.length > 8 ? ` +${tokenIds.length - 8}` : '')
                    : 'None'}
                </div>
                <p className="text-sm text-gray-600">{tokenIds.length} unique assets</p>
              </div>
            </div>
          )}

          {/* Feature list */}
          <div className="text-sm text-gray-600 space-y-2 border-t pt-4">
            <p><strong>Portfolio Features:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Automated token management and rebalancing</li>
              <li>Fee collection and distribution</li>
              <li>Real-time value tracking</li>
              <li>Integration with Registry tier system</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
