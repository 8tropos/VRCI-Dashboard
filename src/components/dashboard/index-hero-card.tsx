'use client';

import { useEffect, useState } from 'react';
import { useContract, useContractQuery } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Pause, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndexMetrics {
  currentValue: bigint;
  baseValue: bigint;
  performanceBp: number;
  lastUpdate: bigint;
}

export function IndexHeroCard() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const [metrics, setMetrics] = useState<IndexMetrics | null>(null);
  const [state, setState] = useState<string>('Active');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!portfolioContract) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch index summary: [current_value, base_value, performance_bp, last_update]
        try {
          const summaryResult = await portfolioContract.query.getIndexSummary();
          if (summaryResult.data?.isOk) {
            const [currentValue, baseValue, performanceBp, lastUpdate] = summaryResult.data.value;
            setMetrics({
              currentValue,
              baseValue,
              performanceBp,
              lastUpdate,
            });
          }
        } catch (e) {
          // Use default values if query fails (e.g., AccountUnmapped)
          setMetrics({
            currentValue: 100n * 10n ** 18n,
            baseValue: 100n * 10n ** 18n,
            performanceBp: 0,
            lastUpdate: BigInt(Date.now()),
          });
        }

        // Fetch portfolio state
        try {
          const stateResult = await portfolioContract.query.getState();
          if (stateResult.data) {
            setState(stateResult.data);
          }
        } catch (e) {
          // Default to Active
        }
      } catch (err) {
        console.warn('Error fetching index data (may need account mapping):', err);
        // Set default metrics so UI still renders
        setMetrics({
          currentValue: 100n * 10n ** 18n,
          baseValue: 100n * 10n ** 18n,
          performanceBp: 0,
          lastUpdate: BigInt(Date.now()),
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [portfolioContract]);

  // Format index value (18 decimals to USD display)
  const formatIndexValue = (value: bigint): string => {
    const num = Number(value) / 1e9;
    return num.toFixed(2);
  };

  // Format performance percentage
  const formatPerformance = (bp: number): string => {
    const percent = bp / 100;
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  // Get time since last update
  const getTimeSinceUpdate = (timestamp: bigint): string => {
    const now = Date.now();
    const updateTime = Number(timestamp);
    const diffMs = now - updateTime;

    if (diffMs < 60000) return 'Just now';
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
    return `${Math.floor(diffMs / 86400000)}d ago`;
  };

  // Get state badge style
  const getStateBadge = () => {
    switch (state) {
      case 'Active':
        return { variant: 'default' as const, icon: Activity, className: 'bg-green-500 hover:bg-green-600' };
      case 'Paused':
        return { variant: 'secondary' as const, icon: Pause, className: 'bg-yellow-500 hover:bg-yellow-600' };
      case 'Maintenance':
        return { variant: 'secondary' as const, icon: Clock, className: 'bg-blue-500 hover:bg-blue-600' };
      case 'Emergency':
        return { variant: 'destructive' as const, icon: AlertTriangle, className: 'bg-red-500 hover:bg-red-600' };
      default:
        return { variant: 'outline' as const, icon: Activity, className: '' };
    }
  };

  const stateBadge = getStateBadge();
  const StateIcon = stateBadge.icon;
  const isPositive = metrics ? metrics.performanceBp >= 0 : true;

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/20 rounded w-1/3"></div>
            <div className="h-16 bg-white/20 rounded w-1/2"></div>
            <div className="h-6 bg-white/20 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <CardContent className="p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">W3PI Index</h2>
            <p className="text-white/70">
              {error || 'Connect wallet to view index data'}
            </p>
            <div className="mt-4 text-4xl font-bold">$100.00</div>
            <p className="text-sm text-white/60 mt-2">Base Value</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <CardContent className="p-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left side - Index Value */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-white/90">W3PI Index Value</h2>
              <Badge className={cn('flex items-center gap-1', stateBadge.className)}>
                <StateIcon className="h-3 w-3" />
                {state}
              </Badge>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-5xl md:text-6xl font-bold tracking-tight">
                ${formatIndexValue(metrics.currentValue)}
              </span>
              <div className={cn(
                'flex items-center gap-1 text-xl font-semibold px-3 py-1 rounded-full',
                isPositive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              )}>
                {isPositive ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                {formatPerformance(metrics.performanceBp)}
              </div>
            </div>

            <p className="text-white/60 text-sm">
              Base: $100.00 • Updated {getTimeSinceUpdate(metrics.lastUpdate)}
            </p>
          </div>

          {/* Right side - Quick Stats */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-white/60 text-xs uppercase tracking-wider">Base Value</p>
              <p className="text-2xl font-bold mt-1">$100.00</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-white/60 text-xs uppercase tracking-wider">
                {isPositive ? 'Gain' : 'Loss'}
              </p>
              <p className={cn(
                'text-2xl font-bold mt-1',
                isPositive ? 'text-green-300' : 'text-red-300'
              )}>
                ${Math.abs(Number(metrics.currentValue - metrics.baseValue) / 1e18).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
