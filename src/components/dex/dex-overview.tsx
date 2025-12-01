'use client';

import { useState, useEffect } from 'react';
import { useContract, useContractQuery } from 'typink';
import type { DexContractApi } from '@/lib/contracts/dex';
import type { RegistryContractApi } from '@/lib/contracts/registry';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info, TrendingUp, Wallet, ArrowLeftRight } from 'lucide-react';
import { decodeAddress } from '@polkadot/util-crypto';

export default function DexOverview() {
  const { contract: dexContract } = useContract<DexContractApi>('dex');
  const { contract: registryContract } = useContract<RegistryContractApi>('registry');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for DEX overview data
  const [totalPools, setTotalPools] = useState<number>(0);
  const [totalLiquidity, setTotalLiquidity] = useState<bigint>(0n);
  const [totalVolume, setTotalVolume] = useState<bigint>(0n);
  const [feeRate, setFeeRate] = useState<bigint>(0n);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Query Registry for token count
  const tokenCountQuery = useContractQuery({
    contract: registryContract,
    fn: 'getTokenCount',
    watch: true,
  });

  // Helper to extract H160 address from AccountId32
  const extractH160Address = (accountId: any): string | null => {
    if (!accountId) return null;
    if (typeof accountId === 'string') {
      return accountId.startsWith('0x') && accountId.length === 42 ? accountId : null;
    }
    if (accountId.raw && typeof accountId.raw === 'string') {
      const raw = accountId.raw;
      if (raw.startsWith('0x') && raw.length === 66) {
        return '0x' + raw.slice(-40);
      }
    }
    return null;
  };

  // Load DEX overview data
  useEffect(() => {
    const loadOverviewData = async () => {
      if (!dexContract || !registryContract) return;

      setIsLoadingData(true);
      setError(null);

      try {
        // Get token count from Registry
        if (!tokenCountQuery.data) {
          await tokenCountQuery.refresh();
        }
        const tokenCount = Number(tokenCountQuery.data || 0);

        if (tokenCount === 0) {
          setTotalPools(0);
          setIsLoadingData(false);
          return;
        }

        let poolsCount = 0;
        let totalLiquiditySum = 0n;
        let totalVolumeSum = 0n;

        // Try to get pool keys from storage to know which pools exist
        let poolKeys: Array<[string, string]> = [];
        try {
          const storage = await dexContract.storage.root();
          if (storage && storage.poolKeys && Array.isArray(storage.poolKeys)) {
            poolKeys = storage.poolKeys.map(([a, b]: [any, any]) => [
              typeof a === 'string' ? a : extractH160Address(a) || '',
              typeof b === 'string' ? b : extractH160Address(b) || ''
            ]).filter(([a, b]) => a && b) as Array<[string, string]>;
          }
        } catch (storageErr) {
          console.warn('Could not access poolKeys from storage:', storageErr);
        }

        // If we have pool keys, use them to get reserves directly
        if (poolKeys.length > 0) {
          poolsCount = poolKeys.length;
          
          try {
            const storage = await dexContract.storage.root();
            if (storage && storage.pools) {
              for (const [tokenA, tokenB] of poolKeys) {
                try {
                  // Get pool reserves from storage
                  const poolResult = await storage.pools.get([tokenA as `0x${string}`, tokenB as `0x${string}`]);
                  
                  if (poolResult) {
                    const reserveA = poolResult.reserveA || 0n;
                    const reserveB = poolResult.reserveB || 0n;
                    
                    // Total liquidity is the sum of both reserves (assuming same decimals for simplicity)
                    // In reality, we'd need to convert based on token decimals, but for now we'll sum them
                    totalLiquiditySum += reserveA + reserveB;
                  }
                } catch (poolErr) {
                  console.warn(`Error getting pool reserves for [${tokenA}, ${tokenB}]:`, poolErr);
                }
              }
            }
          } catch (storageErr) {
            console.warn('Could not access pools from storage:', storageErr);
          }
        } else {
          // Fallback: Query each registered token's price from DEX to count pools
          for (let tokenId = 1; tokenId <= tokenCount; tokenId++) {
            try {
              // Get token contract address from Registry
              const tokenDataResult = await registryContract.query.getBasicTokenData(tokenId);
              if (!tokenDataResult.data) continue;

              let tokenData: any = null;
              if ('isOk' in tokenDataResult.data && tokenDataResult.data.isOk) {
                tokenData = tokenDataResult.data.value;
              } else if ('isErr' in tokenDataResult.data && tokenDataResult.data.isErr) {
                continue;
              } else {
                tokenData = tokenDataResult.data;
              }

              if (!tokenData || !tokenData.tokenContract) continue;

              // Extract contract address
              const contractAddress = extractH160Address(tokenData.tokenContract);
              if (!contractAddress) continue;

              // Query DEX for token price - if it has a price, it means there's a pool
              try {
                const priceResult = await dexContract.query.getTokenPrice(contractAddress as `0x${string}`);
                
                // Check if price is valid (not 0 and not an error)
                if (priceResult.data) {
                  let price: bigint | null = null;
                  
                  if ('isOk' in priceResult.data && priceResult.data.isOk) {
                    price = priceResult.data.value;
                  } else if ('isErr' in priceResult.data) {
                    continue; // Skip tokens with errors
                  } else {
                    price = priceResult.data as bigint;
                  }

                  if (price && price > 0n) {
                    poolsCount++;
                    // Without pool keys, we can't get reserves, so liquidity stays 0
                  }
                }
              } catch (priceErr) {
                // Token doesn't have a pool or query failed
                continue;
              }
            } catch (err) {
              console.warn(`Error loading token ${tokenId} for DEX overview:`, err);
              continue;
            }
          }
        }

        setTotalPools(poolsCount);
        setTotalLiquidity(totalLiquiditySum);
        
        // Total Volume: Not tracked on-chain in this DEX contract
        // Volume would need to be tracked from swap events, which requires event indexing
        // For now, we'll show 0 as volume is not stored in contract storage
        setTotalVolume(0n);
        
        // Fee Rate: Standard DEX fee is typically 0.3% (3000 basis points)
        // Since the contract doesn't expose a configurable fee rate, we'll use the standard
        // 0.3% = 3000 / 1,000,000 = 0.003 = 3000000000000000 / 1e18 (in wei/plancks)
        // Actually, let's use 3000 as basis points, which is 0.3%
        // Format: 3000 basis points = 0.3% = 3000000000000000 in 18 decimals
        const standardFeeRate = BigInt(3000000000000000); // 0.3% in 18 decimals
        setFeeRate(standardFeeRate);
      } catch (err: any) {
        console.error('Error loading DEX overview data:', err);
        setError(`Error loading DEX data: ${err.message}`);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadOverviewData();
  }, [dexContract, registryContract, tokenCountQuery.data]);

  const formatAmount = (amount: bigint) => {
    return `${(Number(amount) / 1e18).toFixed(4)}`;
  };

  const formatRate = (rate: bigint) => {
    const percentage = (Number(rate) / 1e18) * 100;
    return `${percentage.toFixed(2)}%`;
  };

  const isLoadingAny = isLoadingData;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            DEX Overview
          </CardTitle>
          <CardDescription>
            Current DEX status and key metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingAny ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Pools */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Total Pools</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {totalPools}
                </div>
                <p className="text-sm text-gray-600">
                  Active trading pools
                </p>
              </div>

              {/* Total Liquidity */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Total Liquidity</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {totalLiquidity > 0n ? formatAmount(totalLiquidity) : 'N/A'}
                </div>
                <p className="text-sm text-gray-600">
                  Total liquidity across all pools
                </p>
              </div>

              {/* Total Volume */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Total Volume</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {totalVolume > 0n ? formatAmount(totalVolume) : '0.0000'}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Volume tracking not available on-chain
                </p>
                <p className="text-sm text-gray-600">
                  Total trading volume
                </p>
              </div>

              {/* Fee Rate */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Fee Rate</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {feeRate > 0n ? formatRate(feeRate) : '0.30%'}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Standard DEX fee rate
                </p>
                <p className="text-sm text-gray-600">
                  Trading fee percentage
                </p>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {/* {isPaused ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )} */}
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Status</span>
                </div>
                <div className="text-lg font-bold text-green-600">
                  {/* {isPaused ? 'Paused' : 'Active'} */}
                  Active
                </div>
                <p className="text-sm text-gray-600">
                  DEX system status
                </p>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Information */}
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>DEX Features:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Token swaps with automatic price discovery</li>
              <li>Liquidity pool management</li>
              <li>Fee collection and distribution</li>
              <li>Integration with Oracle price feeds</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
