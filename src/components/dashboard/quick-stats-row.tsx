'use client';

import { useEffect, useState } from 'react';
import { useContract } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import type { OracleContractApi } from '@/lib/contracts/oracle';
import { Card, CardContent } from '@/components/ui/card';
import {
  Coins,
  DollarSign,
  Percent,
  Clock,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBgColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

function StatCard({ title, value, subtitle, icon: Icon, iconColor, iconBgColor, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400">{subtitle}</p>
            )}
            {trend && (
              <p className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </p>
            )}
          </div>
          <div className={cn('p-2 rounded-lg', iconBgColor)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickStatsRow() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const { contract: oracleContract } = useContract<OracleContractApi>('oracle');

  const [stats, setStats] = useState({
    totalTokens: 0,
    totalFeesCollected: 0n,
    buyFee: 55, // 0.55% in basis points
    sellFee: 95, // 0.95% in basis points
    dotPrice: 0,
    lastUpdate: 0n,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);

      try {
        if (portfolioContract) {
          // Fetch total tokens held
          try {
            const tokensResult = await portfolioContract.query.getTotalTokensHeld();
            if (tokensResult.data !== undefined) {
              setStats(prev => ({ ...prev, totalTokens: tokensResult.data! }));
            }
          } catch (e) {
            // Ignore individual query errors (e.g., AccountUnmapped)
          }

          // Fetch total fees collected
          try {
            const feesResult = await portfolioContract.query.getTotalFeesCollected();
            if (feesResult.data !== undefined) {
              setStats(prev => ({ ...prev, totalFeesCollected: feesResult.data! }));
            }
          } catch (e) {
            // Ignore
          }

          // Fetch fee configuration
          try {
            const feeConfigResult = await portfolioContract.query.getFeeConfig();
            if (feeConfigResult.data) {
              setStats(prev => ({
                ...prev,
                buyFee: feeConfigResult.data!.buyFeeBp,
                sellFee: feeConfigResult.data!.sellFeeBp,
              }));
            }
          } catch (e) {
            // Ignore
          }

          // Fetch last index update
          try {
            const updateAgeResult = await portfolioContract.query.getIndexUpdateAge();
            if (updateAgeResult.data !== undefined) {
              setStats(prev => ({ ...prev, lastUpdate: updateAgeResult.data! }));
            }
          } catch (e) {
            // Ignore
          }
        }

        if (oracleContract) {
          // Fetch DOT/USD price
          try {
            const dotPriceResult = await oracleContract.query.getDotUsdPrice();
            if (dotPriceResult.data !== undefined && dotPriceResult.data !== null) {
              // Price is in 18 decimals
              const price = Number(dotPriceResult.data) / 1e9;
              setStats(prev => ({ ...prev, dotPrice: price }));
            }
          } catch (e) {
            // Ignore
          }
        }
      } catch (err) {
        // Silently handle errors - show default values
        console.warn('Error fetching stats (may need account mapping):', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [portfolioContract, oracleContract]);

  // Format fee as percentage
  const formatFee = (bp: number): string => `${(bp / 100).toFixed(2)}%`;

  // Format fees collected
  const formatFees = (value: bigint): string => {
    const num = Number(value) / 1e18;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  // Format time since update
  const formatUpdateAge = (ms: bigint): string => {
    const minutes = Number(ms) / 60000;
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${Math.floor(minutes)}m ago`;
    const hours = minutes / 60;
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        title="Portfolio Tokens"
        value={stats.totalTokens.toString()}
        subtitle="Actively tracked"
        icon={Coins}
        iconColor="text-indigo-600"
        iconBgColor="bg-indigo-100"
      />

      <StatCard
        title="DOT/USD"
        value={stats.dotPrice > 0 ? `$${stats.dotPrice.toFixed(2)}` : 'N/A'}
        subtitle="Oracle price"
        icon={DollarSign}
        iconColor="text-green-600"
        iconBgColor="bg-green-100"
      />

      <StatCard
        title="Buy Fee"
        value={formatFee(stats.buyFee)}
        subtitle="Per transaction"
        icon={Percent}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-100"
      />

      <StatCard
        title="Sell Fee"
        value={formatFee(stats.sellFee)}
        subtitle="Per redemption"
        icon={Percent}
        iconColor="text-orange-600"
        iconBgColor="bg-orange-100"
      />

      <StatCard
        title="Fees Collected"
        value={formatFees(stats.totalFeesCollected)}
        subtitle="Total protocol fees"
        icon={Wallet}
        iconColor="text-purple-600"
        iconBgColor="bg-purple-100"
      />

      <StatCard
        title="Last Update"
        value={formatUpdateAge(stats.lastUpdate)}
        subtitle="Index refresh"
        icon={Clock}
        iconColor="text-gray-600"
        iconBgColor="bg-gray-100"
      />
    </div>
  );
}
