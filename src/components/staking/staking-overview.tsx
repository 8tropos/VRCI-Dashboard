'use client';

import { useContract, useContractQuery } from 'typink';
import { useTypink } from 'typink';
import type { StakingContractApi } from '@/lib/contracts/staking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, TrendingUp, Wallet, Clock, DollarSign, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StakingOverview() {
  const { contract: stakingContract } = useContract<StakingContractApi>('staking');
  const { connectedAccount } = useTypink();

  const totalStakedQuery = useContractQuery({
    contract: stakingContract,
    fn: 'getTotalStaked',
  });

  const rewardsPoolQuery = useContractQuery({
    contract: stakingContract,
    fn: 'getRewardsPoolBalance',
  });

  const totalRewardsQuery = useContractQuery({
    contract: stakingContract,
    fn: 'getTotalRewardsDistributed',
  });

  // getUnstakingRateInfo returns [period, rate, totalUnstaking, isActive]: [bigint, bigint, bigint, boolean]
  const unstakingRateQuery = useContractQuery({
    contract: stakingContract,
    fn: 'getUnstakingRateInfo',
  });

  // User-specific stake info (requires connected account address)
  const stakeInfoQuery = useContractQuery(
    connectedAccount?.address
      ? {
          contract: stakingContract,
          fn: 'getStakeInfo',
          args: [connectedAccount.address as `0x${string}`],
        }
      : undefined
  );

  const claimableRewardsQuery = useContractQuery(
    connectedAccount?.address
      ? {
          contract: stakingContract,
          fn: 'getClaimableRewards',
          args: [connectedAccount.address as `0x${string}`],
        }
      : undefined
  );

  const formatW3PI = (amount: bigint): string =>
    `${(Number(amount) / 1e18).toFixed(4)} W3PI`;

  const formatDays = (ms: bigint): string => {
    const days = Number(ms) / (24 * 60 * 60 * 1000);
    if (days < 1) return `${Math.round(Number(ms) / (60 * 1000))} min`;
    return `${days.toFixed(1)} days`;
  };

  const isLoading = totalStakedQuery.isLoading || rewardsPoolQuery.isLoading;

  const unstakingInfo = unstakingRateQuery.data;
  const unstakingPeriod = unstakingInfo?.[0];
  const totalUnstaking = unstakingInfo?.[2];

  const stakeInfo = stakeInfoQuery.data;
  const userStaked = stakeInfo?.amount ?? 0n;
  const tierAtStake = stakeInfo?.tierAtStake ?? 'None';
  const claimable = claimableRewardsQuery.data ?? 0n;

  const refresh = () => {
    totalStakedQuery.refresh();
    rewardsPoolQuery.refresh();
    totalRewardsQuery.refresh();
    unstakingRateQuery.refresh();
    stakeInfoQuery?.refresh?.();
    claimableRewardsQuery?.refresh?.();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Staking Overview
              </CardTitle>
              <CardDescription>Current staking status and key metrics</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              {/* Global Staking Stats */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Protocol Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Total Staked</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {totalStakedQuery.data !== undefined ? formatW3PI(totalStakedQuery.data) : 'N/A'}
                    </div>
                  </div>

                  <div className="space-y-1 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Rewards Pool</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {rewardsPoolQuery.data !== undefined ? formatW3PI(rewardsPoolQuery.data) : 'N/A'}
                    </div>
                  </div>

                  <div className="space-y-1 p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">Total Distributed</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {totalRewardsQuery.data !== undefined ? formatW3PI(totalRewardsQuery.data) : 'N/A'}
                    </div>
                  </div>

                  <div className="space-y-1 p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-700">Unstaking Period</span>
                    </div>
                    <div className="text-xl font-bold text-orange-600">
                      {unstakingPeriod !== undefined ? formatDays(unstakingPeriod) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* User Stake Info */}
              {connectedAccount ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Your Stake</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1 p-4 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-medium">My Staked</span>
                      </div>
                      <div className="text-xl font-bold text-indigo-600">
                        {stakeInfoQuery.isLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
                        ) : (
                          formatW3PI(userStaked)
                        )}
                      </div>
                      {tierAtStake !== 'None' && (
                        <Badge variant="outline" className="text-xs">{tierAtStake}</Badge>
                      )}
                    </div>

                    <div className="space-y-1 p-4 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Claimable Rewards</span>
                      </div>
                      <div className="text-xl font-bold text-green-600">
                        {claimableRewardsQuery.isLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                        ) : (
                          formatW3PI(claimable)
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 p-4 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-teal-600" />
                        <span className="text-sm font-medium">Pending Unstake</span>
                      </div>
                      <div className="text-xl font-bold text-teal-600">
                        {totalUnstaking !== undefined ? formatW3PI(totalUnstaking) : 'N/A'}
                      </div>
                      <p className="text-xs text-gray-500">Protocol-wide unstaking</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Connect your wallet to view your personal staking info.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          <div className="text-sm text-gray-600 space-y-2 border-t pt-4">
            <p><strong>Staking Features:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Stake W3PI tokens to earn rewards from the protocol fee pool</li>
              <li>Flexible unstaking with configurable waiting periods</li>
              <li>Rewards distributed proportionally to stake amount</li>
              <li>Zombie stake detection and cleanup for inactive stakes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
