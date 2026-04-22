'use client';

import { useState } from 'react';
import { useContract, useContractTx, useContractQuery, useTypink } from 'typink';
import type { StakingContractApi } from '@/lib/contracts/staking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, DollarSign, TrendingUp, RefreshCw, Wallet, Activity } from 'lucide-react';

export default function StakingRewards() {
  const { contract: stakingContract } = useContract<StakingContractApi>('staking');
  const { connectedAccount } = useTypink();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const claimRewardsTx = useContractTx(stakingContract, 'claimRewards');

  const rewardsPoolQuery = useContractQuery({
    contract: stakingContract,
    fn: 'getRewardsPoolBalance',
  });

  const totalDistributedQuery = useContractQuery({
    contract: stakingContract,
    fn: 'getTotalRewardsDistributed',
  });

  const totalStakedQuery = useContractQuery({
    contract: stakingContract,
    fn: 'getTotalStaked',
  });

  const claimableQuery = useContractQuery(
    connectedAccount?.address
      ? {
          contract: stakingContract,
          fn: 'getClaimableRewards',
          args: [connectedAccount.address as `0x${string}`],
        }
      : undefined
  );

  const stakeInfoQuery = useContractQuery(
    connectedAccount?.address
      ? {
          contract: stakingContract,
          fn: 'getStakeInfo',
          args: [connectedAccount.address as `0x${string}`],
        }
      : undefined
  );

  const formatW3PI = (amount: bigint): string =>
    `${(Number(amount) / 1e18).toFixed(4)} W3PI`;

  const formatDate = (ts: bigint): string =>
    ts > 0n ? new Date(Number(ts)).toLocaleString() : 'Never';

  const handleClaimRewards = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      await claimRewardsTx.signAndSend({
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setResult({ type: 'claimRewards' });
              claimableQuery?.refresh?.();
              rewardsPoolQuery.refresh();
              totalDistributedQuery.refresh();
            }
          }
        },
      });
    } catch (err: any) {
      setError(`Error claiming rewards: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = () => {
    rewardsPoolQuery.refresh();
    totalDistributedQuery.refresh();
    totalStakedQuery.refresh();
    claimableQuery?.refresh?.();
    stakeInfoQuery?.refresh?.();
  };

  const rewardsPool = rewardsPoolQuery.data ?? 0n;
  const totalDistributed = totalDistributedQuery.data ?? 0n;
  const totalStaked = totalStakedQuery.data ?? 0n;
  const claimable = claimableQuery.data ?? 0n;
  const stakeInfo = stakeInfoQuery.data;
  const lastClaim = stakeInfo?.lastClaim ?? 0n;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Staking Rewards
              </CardTitle>
              <CardDescription>Manage and claim your staking rewards</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Protocol Rewards Stats */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Protocol Rewards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Rewards Pool</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {rewardsPoolQuery.isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600" />
                  ) : formatW3PI(rewardsPool)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Available for distribution</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Total Distributed</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {totalDistributedQuery.isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                  ) : formatW3PI(totalDistributed)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Lifetime rewards paid</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">Total Staked</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {totalStakedQuery.isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
                  ) : formatW3PI(totalStaked)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Earning rewards</p>
              </div>
            </div>
          </div>

          {/* User Rewards */}
          {connectedAccount ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Rewards</h3>
              <div className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-700">Claimable Rewards</span>
                    </div>
                    <div className="text-3xl font-bold text-amber-600">
                      {claimableQuery?.isLoading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600" />
                      ) : formatW3PI(claimable)}
                    </div>
                    {lastClaim > 0n && (
                      <p className="text-xs text-gray-500 mt-1">Last claim: {formatDate(lastClaim)}</p>
                    )}
                  </div>
                  <Button
                    onClick={handleClaimRewards}
                    disabled={isLoading || claimable === 0n}
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    {isLoading ? 'Claiming...' : 'Claim Rewards'}
                  </Button>
                </div>

                {claimable === 0n && !claimableQuery?.isLoading && (
                  <p className="text-sm text-gray-500">
                    No rewards available to claim yet. Stake W3PI tokens to start earning.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                Connect your wallet to view and claim your rewards.
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>Rewards claimed successfully!</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-600 space-y-2 border-t pt-4">
            <p><strong>Rewards System:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Rewards come from protocol fees collected during buy/sell operations</li>
              <li>Claim rewards without unstaking your principal</li>
              <li>Rewards are distributed proportionally to stake amount</li>
              <li>Fund the rewards pool using the Config tab (owner only)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
