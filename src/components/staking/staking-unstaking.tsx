'use client';

import { useState } from 'react';
import { useContract, useContractTx, useContractQuery, useTypink } from 'typink';
import type { StakingContractApi } from '@/lib/contracts/staking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, TrendingDown, RefreshCw } from 'lucide-react';

export default function StakingUnstaking() {
  const { contract: stakingContract } = useContract<StakingContractApi>('staking');
  const { connectedAccount } = useTypink();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const requestUnstakeTx = useContractTx(stakingContract, 'requestUnstake');
  const claimUnstakedTx = useContractTx(stakingContract, 'claimUnstaked');

  // getUnstakingRateInfo returns [period_ms, rate, totalUnstaking, isActive]
  const unstakingRateQuery = useContractQuery({
    contract: stakingContract,
    fn: 'getUnstakingRateInfo',
  });

  const unstakingRequestsQuery = useContractQuery(
    connectedAccount?.address
      ? {
          contract: stakingContract,
          fn: 'getUnstakingRequests',
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

  const formatDuration = (ms: bigint): string => {
    const totalSeconds = Number(ms) / 1000;
    if (totalSeconds < 60) return `${Math.round(totalSeconds)} seconds`;
    const days = totalSeconds / (24 * 60 * 60);
    if (days >= 1) return `${days.toFixed(1)} days`;
    const hours = totalSeconds / 3600;
    return `${hours.toFixed(1)} hours`;
  };

  const formatDate = (ts: bigint): string =>
    new Date(Number(ts)).toLocaleString();

  const handleRequestUnstake = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const amountWei = BigInt(Math.floor(Number(amount) * 1e18));
      await requestUnstakeTx.signAndSend({
        args: [amountWei],
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setResult({ type: 'requestUnstake', amount });
              setAmount('');
              unstakingRequestsQuery?.refresh?.();
              stakeInfoQuery?.refresh?.();
            }
          }
        },
      });
    } catch (err: any) {
      setError(`Error requesting unstake: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimUnstaked = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      await claimUnstakedTx.signAndSend({
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setResult({ type: 'claimUnstaked' });
              unstakingRequestsQuery?.refresh?.();
            }
          }
        },
      });
    } catch (err: any) {
      setError(`Error claiming unstaked tokens: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = () => {
    unstakingRateQuery.refresh();
    unstakingRequestsQuery?.refresh?.();
    stakeInfoQuery?.refresh?.();
  };

  const unstakingInfo = unstakingRateQuery.data;
  const unstakingPeriod = unstakingInfo?.[0];

  const requests = unstakingRequestsQuery.data ?? [];
  const now = Date.now();
  const claimableRequests = requests.filter(r => !r.claimed && Number(r.availableAt) <= now);
  const pendingRequests = requests.filter(r => !r.claimed && Number(r.availableAt) > now);
  const claimedRequests = requests.filter(r => r.claimed);

  const myStaked = stakeInfoQuery.data?.amount ?? 0n;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Unstaking Management
              </CardTitle>
              <CardDescription>Request unstaking and claim your tokens</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Unstaking Period Info */}
          <div className="bg-orange-50 p-4 rounded-lg">
            <Label className="text-orange-700 font-medium">Unstaking Period</Label>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              {unstakingRateQuery.isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600" />
              ) : unstakingPeriod !== undefined ? (
                formatDuration(unstakingPeriod)
              ) : (
                'N/A'
              )}
            </div>
            <p className="text-sm text-orange-700/70 mt-1">
              Waiting period before tokens can be claimed after unstaking request
            </p>
          </div>

          {connectedAccount ? (
            <>
              {/* User's Staked Balance */}
              {stakeInfoQuery.data && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Your Staked Balance</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{formatW3PI(myStaked)}</p>
                </div>
              )}

              {/* Request Unstake */}
              <div className="space-y-4">
                <h3 className="font-medium">Request Unstake</h3>
                <div className="flex gap-2">
                  <Input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount in W3PI (e.g. 10.5)"
                    type="number"
                    min="0"
                    step="0.0001"
                  />
                  <Button
                    onClick={handleRequestUnstake}
                    disabled={!amount || isLoading}
                    className="flex items-center gap-2 shrink-0"
                  >
                    <TrendingDown className="h-4 w-4" />
                    Request
                  </Button>
                </div>
              </div>

              {/* Unstaking Requests */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Your Unstaking Requests</h3>
                  {claimableRequests.length > 0 && (
                    <Button onClick={handleClaimUnstaked} disabled={isLoading} size="sm" className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Claim All ({claimableRequests.length})
                    </Button>
                  )}
                </div>

                {unstakingRequestsQuery.isLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                  </div>
                ) : requests.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">No unstaking requests</p>
                ) : (
                  <div className="space-y-2">
                    {/* Claimable */}
                    {claimableRequests.map((req, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <p className="font-medium text-green-800">{formatW3PI(req.amount)}</p>
                          <p className="text-xs text-green-600">Ready since {formatDate(req.availableAt)}</p>
                        </div>
                        <Badge className="bg-green-500 text-white">Ready to Claim</Badge>
                      </div>
                    ))}

                    {/* Pending */}
                    {pendingRequests.map((req, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div>
                          <p className="font-medium text-orange-800">{formatW3PI(req.amount)}</p>
                          <p className="text-xs text-orange-600">Available {formatDate(req.availableAt)}</p>
                          <p className="text-xs text-gray-500">Requested {formatDate(req.requestedAt)}</p>
                        </div>
                        <Badge variant="outline" className="text-orange-600 border-orange-300">Pending</Badge>
                      </div>
                    ))}

                    {/* Claimed */}
                    {claimedRequests.slice(0, 3).map((req, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div>
                          <p className="font-medium text-gray-600">{formatW3PI(req.amount)}</p>
                          <p className="text-xs text-gray-400">Claimed</p>
                        </div>
                        <Badge variant="outline" className="text-gray-500">Claimed</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <Alert>
              <AlertDescription>Connect your wallet to manage unstaking.</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                {result.type === 'requestUnstake'
                  ? `Unstake request submitted for ${result.amount} W3PI.`
                  : 'Tokens claimed successfully!'}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-600 space-y-2 border-t pt-4">
            <p><strong>Unstaking Process:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Request unstaking to start the waiting period</li>
              <li>Wait for the unstaking period to complete</li>
              <li>Claim your tokens after the waiting period</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
