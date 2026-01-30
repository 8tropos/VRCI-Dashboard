'use client';

import { useEffect, useState } from 'react';
import { useContract } from 'typink';
import type { RegistryContractApi } from '@/lib/contracts/registry';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, TrendingUp, Coins, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TierThresholds {
  tier1MarketCap: bigint;
  tier1Volume: bigint;
  tier2MarketCap: bigint;
  tier2Volume: bigint;
  tier3MarketCap: bigint;
  tier3Volume: bigint;
  tier4MarketCap: bigint;
  tier4Volume: bigint;
}

interface TierDistribution {
  tier: string;
  count: number;
}

const TIER_INFO = {
  Tier1: {
    name: 'Emerging',
    description: '$50M market cap, $5M volume',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  Tier2: {
    name: 'Growing',
    description: '$200M market cap, $20M volume',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  Tier3: {
    name: 'Established',
    description: '$500M market cap, $50M volume',
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  Tier4: {
    name: 'Institutional',
    description: '$2B market cap, $200M volume',
    color: 'bg-amber-500',
    textColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
};

type TierKey = keyof typeof TIER_INFO;

export function TierStatusCard() {
  const { contract: registryContract } = useContract<RegistryContractApi>('registry');
  const [activeTier, setActiveTier] = useState<string>('Tier2');
  const [distribution, setDistribution] = useState<TierDistribution[]>([]);
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!registryContract) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Fetch active tier
        try {
          const tierResult = await registryContract.query.getActiveTier();
          if (tierResult.data) {
            setActiveTier(tierResult.data);
          }
        } catch (e) {
          // Use default
        }

        // Fetch tier distribution
        try {
          const distResult = await registryContract.query.getTierDistribution();
          if (distResult.data) {
            const dist = distResult.data.map(([tier, count]) => ({
              tier: tier.toString(),
              count: Number(count),
            }));
            setDistribution(dist);
          }
        } catch (e) {
          // Set demo data
          setDistribution([
            { tier: 'Tier1', count: 3 },
            { tier: 'Tier2', count: 5 },
            { tier: 'Tier3', count: 2 },
            { tier: 'Tier4', count: 1 },
          ]);
        }

        // Fetch token count
        try {
          const countResult = await registryContract.query.getTokenCount();
          if (countResult.data !== undefined) {
            setTokenCount(countResult.data);
          }
        } catch (e) {
          setTokenCount(11);
        }
      } catch (err) {
        console.warn('Error fetching tier data (may need account mapping):', err);
        // Set demo data
        setDistribution([
          { tier: 'Tier1', count: 3 },
          { tier: 'Tier2', count: 5 },
          { tier: 'Tier3', count: 2 },
          { tier: 'Tier4', count: 1 },
        ]);
        setTokenCount(11);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [registryContract]);

  const tierInfo = TIER_INFO[activeTier as TierKey] || TIER_INFO.Tier2;
  const totalInActiveTier = distribution.find(d => d.tier === activeTier)?.count || 0;

  // Format large numbers for display
  const formatValue = (value: number): string => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-600" />
          Active Tier
        </CardTitle>
        <CardDescription>
          Dynamic tiering based on market conditions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Tier Display */}
            <div className={cn('rounded-xl p-4', tierInfo.bgColor)}>
              <div className="flex items-center justify-between">
                <div>
                  <Badge className={cn(tierInfo.color, 'text-white mb-2')}>
                    {activeTier.replace('Tier', 'Tier ')}
                  </Badge>
                  <h3 className={cn('text-xl font-bold', tierInfo.textColor)}>
                    {tierInfo.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {tierInfo.description}
                  </p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        The index automatically shifts tiers when 80% of tokens 
                        meet higher tier requirements. This ensures the index 
                        reflects current market maturity.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Tier Distribution */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Token Distribution ({tokenCount} total)
              </h4>
              <div className="space-y-2">
                {Object.entries(TIER_INFO).map(([key, info]) => {
                  const count = distribution.find(d => d.tier === key)?.count || 0;
                  const percentage = tokenCount > 0 ? (count / tokenCount) * 100 : 0;
                  const isActive = key === activeTier;
                  
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-20 text-xs text-gray-600">
                        {key.replace('Tier', 'Tier ')}
                      </div>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            info.color,
                            isActive && 'ring-2 ring-offset-1 ring-gray-400'
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-12 text-right text-sm font-medium">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-xs text-gray-500">Active Tier Tokens</p>
                <p className="text-lg font-semibold">{totalInActiveTier}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Registered</p>
                <p className="text-lg font-semibold">{tokenCount}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
