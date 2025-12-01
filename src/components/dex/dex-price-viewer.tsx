'use client';

import { useState, useEffect } from 'react';
import { useContract, formatBalance } from 'typink';
import type { DexContractApi } from '@/lib/contracts/dex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { DEPLOYED_TOKENS } from '@/lib/token-deployments';

export default function DexPriceViewer() {
  const { contract: dexContract } = useContract<DexContractApi>('dex');
  const [tokenAddress, setTokenAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // State for market overview data
  const [totalLiquidity, setTotalLiquidity] = useState<bigint>(0n);
  const [totalVolume, setTotalVolume] = useState<bigint>(0n);
  const [feeRate, setFeeRate] = useState<bigint>(0n);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load market overview data (same as overview tab)
  useEffect(() => {
    const loadMarketData = async () => {
      if (!dexContract) return;

      setIsLoadingData(true);
      try {
        // Get pool keys from storage
        let poolKeys: Array<[string, string]> = [];
        let totalLiquiditySum = 0n;

        try {
          const storage = await dexContract.storage.root();
          if (storage && storage.poolKeys && Array.isArray(storage.poolKeys)) {
            poolKeys = storage.poolKeys.map(([a, b]: [any, any]) => {
              const extractH160 = (addr: any): string => {
                if (typeof addr === 'string' && addr.startsWith('0x') && addr.length === 42) {
                  return addr;
                }
                if (addr?.raw && typeof addr.raw === 'string' && addr.raw.startsWith('0x') && addr.raw.length === 66) {
                  return '0x' + addr.raw.slice(-40);
                }
                return '';
              };
              return [extractH160(a), extractH160(b)];
            }).filter(([a, b]) => a && b) as Array<[string, string]>;
          }

          // Get reserves for each pool
          if (poolKeys.length > 0 && storage && storage.pools) {
            for (const [tokenA, tokenB] of poolKeys) {
              try {
                const poolResult = await storage.pools.get([tokenA as `0x${string}`, tokenB as `0x${string}`]);
                if (poolResult) {
                  totalLiquiditySum += (poolResult.reserveA || 0n) + (poolResult.reserveB || 0n);
                }
              } catch (poolErr) {
                console.warn(`Error getting pool reserves for [${tokenA}, ${tokenB}]:`, poolErr);
              }
            }
          }
        } catch (storageErr) {
          console.warn('Could not access storage:', storageErr);
        }

        setTotalLiquidity(totalLiquiditySum);
        setTotalVolume(0n); // Volume not tracked on-chain
        setFeeRate(BigInt(3000000000000000)); // 0.3% in 18 decimals
      } catch (err: any) {
        console.error('Error loading market data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadMarketData();
  }, [dexContract]);

  const handleGetPrice = async () => {
    if (!tokenAddress) {
      setError('Please enter a token address');
      return;
    }

    // Validate and normalize address format
    let normalizedAddress = tokenAddress.trim().toLowerCase();
    
    // Pad address if it's 41 characters (missing leading zero)
    if (normalizedAddress.startsWith('0x') && normalizedAddress.length === 41) {
      normalizedAddress = '0x0' + normalizedAddress.slice(2);
    }
    
    if (!normalizedAddress.startsWith('0x') || normalizedAddress.length !== 42) {
      setError('Invalid token address format. Please use H160 format (0x... with 42 characters)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!dexContract) {
        setError('Contract not available');
        return;
      }

      console.log('Querying price for token:', normalizedAddress);
      const priceResult = await dexContract.query.getTokenPrice(normalizedAddress as `0x${string}`);
      
      console.log('Price result full object:', JSON.stringify(priceResult, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value, 2));
      console.log('Price result.data:', priceResult.data);
      console.log('Price result.data type:', typeof priceResult.data);
      
      // Extract price from result - handle different response formats
      let price: bigint | null = null;
      
      if (priceResult && priceResult.data !== undefined && priceResult.data !== null) {
        const data: any = priceResult.data;
        
        // Check if it's a Result type (isOk/isErr)
        if (typeof data === 'object' && data !== null) {
          if ('isOk' in data && data.isOk === true) {
            // Result type with isOk = true
            if ('value' in data) {
              const value = data.value;
              price = typeof value === 'bigint' ? value : BigInt(String(value));
              console.log('Price extracted from isOk.value:', price.toString());
            }
          } else if ('isErr' in data && data.isErr === true) {
            // Result type with isErr = true
            const error = data.err;
            console.error('Contract returned error:', error);
            throw new Error(`Contract error: ${JSON.stringify(error)}`);
          } else if ('value' in data && typeof data.value !== 'undefined') {
            // Direct value property
            const value = data.value;
            price = typeof value === 'bigint' ? value : BigInt(String(value));
            console.log('Price extracted from value property:', price.toString());
          } else {
            // Try to extract as string and convert
            const dataStr = String(data);
            if (dataStr && dataStr !== 'null' && dataStr !== 'undefined' && !isNaN(Number(dataStr))) {
              price = BigInt(dataStr.replace(/,/g, ''));
              console.log('Price extracted from string conversion:', price.toString());
            }
          }
        } else if (typeof data === 'bigint') {
          price = data;
          console.log('Price is direct bigint:', price.toString());
        } else if (typeof data === 'number') {
          price = BigInt(data);
          console.log('Price converted from number:', price.toString());
        } else if (typeof data === 'string') {
          const cleaned = data.replace(/,/g, '').trim();
          if (cleaned && !isNaN(Number(cleaned))) {
            price = BigInt(cleaned);
            console.log('Price extracted from string:', price.toString());
          }
        }
      }

      console.log('Final extracted price:', price?.toString() || 'null');

      if (price === null) {
        throw new Error('No price data returned from contract. Check console for details.');
      }

      // Even if price is 0, we should still show it (it might be a valid result)
      setResult({
        tokenAddress: normalizedAddress,
        price: price
      });
      
      if (price === 0n) {
        setError('Price returned is 0. This might indicate the pool has no liquidity or the price calculation returned zero.');
      }
    } catch (err: any) {
      console.error('Error getting token price:', err);
      setError(`Error getting token price: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (amount: bigint, decimals: number = 9) => {
    // DEX prices are typically in 9 decimals (like Oracle prices)
    // Use BigInt division to avoid precision loss
    const divisor = BigInt(10 ** decimals);
    const wholePart = amount / divisor;
    const fractionalPart = amount % divisor;
    
    // Convert to string with proper decimal formatting
    const wholeStr = wholePart.toString();
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '');
    
    // Combine whole and fractional parts
    if (fractionalStr === '') {
      return wholeStr;
    }
    
    const result = `${wholeStr}.${fractionalStr}`;
    
    // For very small values, ensure we show enough precision
    if (wholePart === 0n && fractionalPart > 0n) {
      // Count leading zeros in fractional part
      const leadingZeros = fractionalStr.match(/^0*/)?.[0]?.length || 0;
      // If more than 6 leading zeros, use scientific notation
      if (leadingZeros > 6) {
        const numValue = Number(result);
        return numValue.toExponential(6);
      }
    }
    
    return result;
  };
  
  const formatAmount = (amount: bigint) => {
    // For liquidity amounts, use 18 decimals
    return formatBalance(amount, { decimals: 18, symbol: '' }).trim();
  };

  const formatRate = (rate: bigint) => {
    const percentage = (Number(rate) / 1e18) * 100;
    return `${percentage.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Price Viewer
          </CardTitle>
          <CardDescription>
            View token prices and market data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Market Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {isLoadingData ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : totalLiquidity > 0n ? (
                  formatAmount(totalLiquidity)
                ) : (
                  '0.0000'
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Liquidity</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {isLoadingData ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : totalVolume > 0n ? (
                  formatAmount(totalVolume)
                ) : (
                  '0.0000'
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Volume</div>
              <div className="text-xs text-gray-500 mt-1">Not tracked on-chain</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {isLoadingData ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : feeRate > 0n ? (
                  formatRate(feeRate)
                ) : (
                  '0.30%'
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Fee Rate</div>
              <div className="text-xs text-gray-500 mt-1">Standard DEX fee</div>
            </div>
          </div>

          {/* Token Price Lookup */}
          <div className="space-y-4">
            <h3 className="font-medium">Token Price Lookup</h3>
            <div className="space-y-2">
              <Label>Token Address</Label>
              <div className="flex gap-2">
                <Input
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder="Enter token address (0x...)"
                  className="flex-1"
                />
              </div>
              {/* Quick select buttons for deployed tokens */}
              <div className="flex flex-wrap gap-2">
                {Object.values(DEPLOYED_TOKENS).map((token) => {
                  if (!('contractAddress' in token) || typeof token.contractAddress !== 'string') return null;
                  const addr = token.contractAddress.toLowerCase();
                  // Ensure address is 42 characters (pad if needed)
                  const paddedAddr = addr.length === 41 ? '0x0' + addr.slice(2) : addr;
                  return (
                    <Button
                      key={token.symbol}
                      variant="outline"
                      size="sm"
                      onClick={() => setTokenAddress(paddedAddr)}
                      className="text-xs"
                    >
                      {token.symbol}
                    </Button>
                  );
                })}
              </div>
            </div>
            <Button
              onClick={handleGetPrice}
              disabled={!tokenAddress || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <DollarSign className="h-4 w-4" />
              )}
              Get Price
            </Button>
          </div>

          {/* Price Result */}
          {result && (
            <div className="space-y-2">
              <Label>Token Price</Label>
              <div className={`p-4 rounded-lg border ${
                result.price === 0n 
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                  : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              }`}>
                <div className={`text-xl font-bold ${
                  result.price === 0n 
                    ? 'text-yellow-600 dark:text-yellow-400' 
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {formatPrice(result.price || BigInt(0), 9)}
                  {result.price === 0n && (
                    <span className="ml-2 text-sm font-normal text-yellow-700 dark:text-yellow-300">
                      (Price is zero - check pool reserves)
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Price for token: <span className="font-mono text-xs">{result.tokenAddress}</span>
                </div>
                {result.price > 0n && (
                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                    <div>Raw value: {result.price.toString()}</div>
                    <div>Price in 9 decimals format (like Oracle prices)</div>
                  </div>
                )}
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
            <p><strong>Price Data:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Real-time token price calculations</li>
              <li>Market liquidity and volume tracking</li>
              <li>Fee rate information</li>
              <li>Integration with Oracle price feeds</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
