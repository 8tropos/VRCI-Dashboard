'use client';

import { useState, useEffect } from 'react';
import { useContract, useContractTx, useContractQuery } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import type { RegistryContractApi } from '@/lib/contracts/registry';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Plus, Wallet, Loader2, RefreshCw, AlertTriangle, Target, Calculator, TrendingUp } from 'lucide-react';
import { LabelWithHelp } from '@/components/ui/field-help';
import { txToaster } from '@/utils/txToaster';
import { getDeployedToken, DEPLOYED_TOKENS } from '@/lib/token-deployments';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RegisteredToken {
  tokenId: number;
  symbol?: string;
  name?: string;
  contractAddress: string;
  marketCap?: bigint;
  price?: bigint;
}

interface TokenWithWeight extends RegisteredToken {
  calculatedWeight: number;
  calculatedAmount: string;
  investmentAmount: number;
}

export default function PortfolioTokenManager() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const { contract: registryContract } = useContract<RegistryContractApi>('registry');
  
  // Manual entry state
  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  
  // Automatic weight calculation state
  const [totalInvestment, setTotalInvestment] = useState('');
  const [selectedTokens, setSelectedTokens] = useState<Set<number>>(new Set());
  const [tokensWithWeights, setTokensWithWeights] = useState<TokenWithWeight[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [registeredTokens, setRegisteredTokens] = useState<RegisteredToken[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);

  // Transaction hooks
  const addTokenHoldingTx = useContractTx(portfolioContract, 'addTokenHolding');
  const initializeBaseValueTx = useContractTx(portfolioContract, 'initializeBasePortfolioValue');

  // Query hooks
  const remainingWeightQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getRemainingWeightCapacity',
  });

  const registryTokenCountQuery = useContractQuery({
    contract: registryContract,
    fn: 'getTokenCount',
  });

  // Load registered tokens from Registry with market cap data
  useEffect(() => {
    const loadRegisteredTokens = async () => {
      if (!registryContract) return;

      setIsLoadingTokens(true);
      try {
        await registryTokenCountQuery.refresh();
        const count = Number(registryTokenCountQuery.data || 0);

        if (count === 0) {
          setRegisteredTokens([]);
          setIsLoadingTokens(false);
          return;
        }

        const tokens: RegisteredToken[] = [];
        for (let id = 1; id <= count; id++) {
          try {
            // Get enriched token data which includes market cap
            const enrichedResult = await registryContract.query.getEnrichedTokenData(id);
            let enrichedData: any = null;
            
            if (enrichedResult.data) {
              if ('isOk' in enrichedResult.data && enrichedResult.data.isOk) {
                enrichedData = enrichedResult.data.value;
              } else if ('isErr' in enrichedResult.data && enrichedData.isErr) {
                // Fallback to basic data if enriched fails
              } else {
                enrichedData = enrichedResult.data;
              }
            }

            // Fallback to basic data if enriched data not available
            if (!enrichedData) {
              const basicResult = await registryContract.query.getBasicTokenData(id);
              if (!basicResult.data) continue;

              let tokenData: any = null;
              if ('isOk' in basicResult.data && basicResult.data.isOk) {
                tokenData = basicResult.data.value;
              } else if ('isErr' in basicResult.data && basicResult.data.isErr) {
                continue;
              } else {
                tokenData = basicResult.data;
              }
              enrichedData = tokenData;
            }

            if (!enrichedData) continue;

            // Extract contract address
            let contractAddress: string = 'Unknown';
            if (enrichedData.tokenContract) {
              if (typeof enrichedData.tokenContract === 'string') {
                contractAddress = enrichedData.tokenContract;
              } else if (typeof (enrichedData.tokenContract as any)?.address === 'function') {
                contractAddress = (enrichedData.tokenContract as any).address();
              } else if (typeof (enrichedData.tokenContract as any)?.toString === 'function') {
                contractAddress = (enrichedData.tokenContract as any).toString();
              } else {
                contractAddress = String(enrichedData.tokenContract);
              }
            }

            // Normalize address
            const normalizedAddress = contractAddress.toLowerCase().startsWith('0x') 
              ? contractAddress.toLowerCase() 
              : `0x${contractAddress.toLowerCase()}`;

            // Find matching deployed token
            const deployedToken = Object.values(DEPLOYED_TOKENS).find(
              (t) => 'contractAddress' in t && typeof t.contractAddress === 'string' && t.contractAddress.toLowerCase() === normalizedAddress
            ) as typeof DEPLOYED_TOKENS[keyof typeof DEPLOYED_TOKENS] | undefined;

            tokens.push({
              tokenId: id,
              symbol: deployedToken?.symbol,
              name: deployedToken?.name,
              contractAddress: normalizedAddress,
              marketCap: enrichedData.marketCap ? BigInt(enrichedData.marketCap.toString()) : undefined,
              price: enrichedData.price ? BigInt(enrichedData.price.toString()) : undefined,
            });
          } catch (err) {
            // Skip tokens that fail to load
            console.warn(`Failed to load token ${id}:`, err);
          }
        }

        setRegisteredTokens(tokens);
      } catch (err) {
        console.error('Error loading registered tokens:', err);
      } finally {
        setIsLoadingTokens(false);
      }
    };

    if (registryContract) {
      loadRegisteredTokens();
    }
  }, [registryContract, registryTokenCountQuery.data]);

  // Calculate weights based on market cap proportions
  const calculateWeightsFromMarketCap = () => {
    if (!totalInvestment || selectedTokens.size === 0) {
      setTokensWithWeights([]);
      return;
    }

    setIsCalculating(true);
    try {
      const investmentAmount = parseFloat(totalInvestment);
      if (isNaN(investmentAmount) || investmentAmount <= 0) {
        setError('Please enter a valid investment amount');
        setIsCalculating(false);
        return;
      }

      // Get selected tokens with market cap data
      const selectedTokenData = registeredTokens.filter(
        (t) => selectedTokens.has(t.tokenId) && t.marketCap !== undefined && t.marketCap > 0n
      );

      if (selectedTokenData.length === 0) {
        setError('Selected tokens must have market cap data. Please ensure tokens have been updated in the Oracle.');
        setIsCalculating(false);
        return;
      }

      // Calculate total market cap
      const totalMarketCap = selectedTokenData.reduce(
        (sum, token) => sum + (token.marketCap || 0n),
        0n
      );

      if (totalMarketCap === 0n) {
        setError('Total market cap is zero. Cannot calculate weights.');
        setIsCalculating(false);
        return;
      }

      // Calculate weights and amounts for each token
      const tokensWithCalculatedWeights: TokenWithWeight[] = selectedTokenData.map((token) => {
        const marketCapShare = Number(token.marketCap || 0n) / Number(totalMarketCap);
        const weightBp = Math.round(marketCapShare * 10000); // Convert to basis points
        const tokenInvestment = investmentAmount * marketCapShare;
        
        // Calculate token amount based on price (if available)
        // Note: This is a simplified calculation. In production, you'd need to:
        // 1. Get token decimals from the token contract
        // 2. Properly scale the price and investment amounts
        // 3. Handle different decimal precisions
        let calculatedAmount = '0';
        if (token.price && token.price > 0n) {
          try {
            // Price is typically stored with 18 decimals in the contract
            // Investment is in USD, so we need: tokenAmount = (investmentUSD * 10^18) / price
            // This gives us the amount in token's smallest unit (assuming 18 decimals for token too)
            const priceBigInt = token.price;
            const investmentScaled = BigInt(Math.round(tokenInvestment * 1e18));
            const tokenAmount = (investmentScaled * BigInt(1e18)) / priceBigInt;
            calculatedAmount = tokenAmount.toString();
          } catch (err) {
            console.warn(`Could not calculate amount for token ${token.tokenId}:`, err);
            // Fallback: use a placeholder that user can adjust manually
            calculatedAmount = '0';
          }
        }

        return {
          ...token,
          calculatedWeight: weightBp,
          calculatedAmount,
          investmentAmount: tokenInvestment,
        };
      });

      // Verify total weights sum to 10000
      const totalWeight = tokensWithCalculatedWeights.reduce((sum, t) => sum + t.calculatedWeight, 0);
      if (totalWeight !== 10000) {
        // Adjust the last token's weight to make total exactly 10000
        const diff = 10000 - totalWeight;
        if (tokensWithCalculatedWeights.length > 0) {
          tokensWithCalculatedWeights[tokensWithCalculatedWeights.length - 1].calculatedWeight += diff;
        }
      }

      setTokensWithWeights(tokensWithCalculatedWeights);
      setError(null);
    } catch (err: any) {
      console.error('Error calculating weights:', err);
      setError(`Error calculating weights: ${err.message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle bulk token addition with calculated weights
  const handleBulkAddTokens = async () => {
    if (tokensWithWeights.length === 0) {
      setError('No tokens with calculated weights. Please calculate weights first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let successCount = 0;
      const totalCount = tokensWithWeights.length;

      // Add tokens sequentially
      for (let i = 0; i < tokensWithWeights.length; i++) {
        const token = tokensWithWeights[i];
        const toaster = txToaster(`Adding ${token.symbol || 'Token'} (${i + 1}/${totalCount})...`);
        
        try {
          toaster.onTxPending();
          
          await addTokenHoldingTx.signAndSend({
            args: [token.tokenId, BigInt(token.calculatedAmount || '0'), token.calculatedWeight],
            callback: (progress) => {
              toaster.onTxProgress(progress);
              if (progress.status.type === 'BestChainBlockIncluded' && !progress.dispatchError) {
                successCount++;
                if (successCount === totalCount) {
                  // All tokens added
                  setResult({
                    type: 'bulkAdd',
                    hash: 'success',
                    count: totalCount,
                  });
                  setTokensWithWeights([]);
                  setSelectedTokens(new Set());
                  setTotalInvestment('');
                  remainingWeightQuery.refresh();
                }
              }
            },
          });
        } catch (err: any) {
          console.error(`Error adding token ${token.tokenId}:`, err);
          toaster.onTxError(err instanceof Error ? err : new Error('Unknown error'));
          setError(`Error adding ${token.symbol || 'token'}: ${err.message}`);
          // Continue with next token
        }
      }
    } catch (err: any) {
      console.error('Error in bulk add:', err);
      setError(`Error adding tokens: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToken = async () => {
    if (!tokenId || !amount || !targetWeight) {
      setError('Please enter token ID, amount, and target weight');
      return;
    }

    const tokenIdNum = parseInt(tokenId);
    const weightNum = parseInt(targetWeight);

    if (isNaN(tokenIdNum) || tokenIdNum <= 0) {
      setError('Token ID must be a positive number');
      return;
    }

    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 10000) {
      setError('Target weight must be between 1 and 10000 basis points (0.01% to 100%)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    const toaster = txToaster(`Adding token ${tokenId} to portfolio...`);

    try {
      toaster.onTxPending();
      
      await addTokenHoldingTx.signAndSend({
        args: [tokenIdNum, BigInt(amount), weightNum],
        callback: (progress) => {
          toaster.onTxProgress(progress);
          if (progress.status.type === 'BestChainBlockIncluded' && !progress.dispatchError) {
            setResult({ 
              type: 'addToken', 
              hash: 'success', 
              tokenId: tokenIdNum,
              weight: weightNum 
            });
            setTokenId('');
            setAmount('');
            setTargetWeight('');
            remainingWeightQuery.refresh();
          }
        },
      });
    } catch (err: any) {
      console.error('Error adding token:', err);
      toaster.onTxError(err instanceof Error ? err : new Error('Unknown error'));
      setError(`Error adding token: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeBaseValue = async () => {
    if (!confirm('This will initialize the base portfolio value. This can only be done once! Are you sure?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    const toaster = txToaster('Initializing base portfolio value...');

    try {
      toaster.onTxPending();
      
      await initializeBaseValueTx.signAndSend({
        args: [],
        callback: (progress) => {
          toaster.onTxProgress(progress);
          if (progress.status.type === 'BestChainBlockIncluded' && !progress.dispatchError) {
            setResult({ 
              type: 'initializeBaseValue', 
              hash: 'success',
              message: 'Base portfolio value initialized successfully'
            });
          }
        },
      });
    } catch (err: any) {
      console.error('Error initializing base value:', err);
      toaster.onTxError(err instanceof Error ? err : new Error('Unknown error'));
      setError(`Error initializing base value: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const remainingWeight = remainingWeightQuery.data ? Number(remainingWeightQuery.data) : 10000;
  const totalWeightUsed = 10000 - remainingWeight;

  return (
    <div className="space-y-6">
      {/* Automatic Weight Calculation Based on Market Cap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Automatic Weight Calculation (Market Cap Based)
          </CardTitle>
          <CardDescription>
            Calculate token weights automatically based on market cap proportions (Phase 4.1)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>How it works:</strong> Enter your total investment amount (e.g., $1,000). 
              The system will calculate token weights proportionally based on each token's share of the total market cap. 
              For example, if Token A has 50% of the combined market cap, it will receive 50% of your investment (5000 basis points).
            </AlertDescription>
          </Alert>

          {/* Total Investment Input */}
          <div className="space-y-2">
            <LabelWithHelp
              htmlFor="totalInvestment"
              helpText="Enter your total investment amount in USD (e.g., 1000 for $1,000). This amount will be distributed proportionally to tokens based on their market cap share. The system calculates weights automatically - you don't need to set them manually."
            >
              Total Investment Amount (USD) *
            </LabelWithHelp>
            <Input
              id="totalInvestment"
              type="number"
              min="0"
              step="0.01"
              value={totalInvestment}
              onChange={(e) => setTotalInvestment(e.target.value)}
              placeholder="e.g., 1000"
              disabled={isLoading || isCalculating}
            />
          </div>

          {/* Token Selection */}
          {registeredTokens.length > 0 && (
            <div className="space-y-2">
              <Label>Select Tokens to Add (must have market cap data)</Label>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg max-h-60 overflow-y-auto">
                {isLoadingTokens ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-500">Loading tokens...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {registeredTokens.map((token) => {
                      const hasMarketCap = token.marketCap !== undefined && token.marketCap > 0n;
                      return (
                        <label
                          key={token.tokenId}
                          className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTokens.has(token.tokenId)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedTokens);
                              if (e.target.checked) {
                                if (hasMarketCap) {
                                  newSelected.add(token.tokenId);
                                } else {
                                  setError(`${token.symbol || 'Token'} (ID: ${token.tokenId}) does not have market cap data. Please update it in the Oracle first.`);
                                  return;
                                }
                              } else {
                                newSelected.delete(token.tokenId);
                              }
                              setSelectedTokens(newSelected);
                            }}
                            disabled={!hasMarketCap || isLoading || isCalculating}
                            className="rounded"
                          />
                          <span className="flex-1">
                            <span className="font-medium">{token.symbol || 'Token'}</span>
                            <span className="text-sm text-gray-500 ml-2">(ID: {token.tokenId})</span>
                            {!hasMarketCap && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                No Market Cap
                              </Badge>
                            )}
                          </span>
                          {token.marketCap && (
                            <span className="text-xs text-gray-500">
                              MC: ${(Number(token.marketCap) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Calculate Weights Button */}
          <Button
            onClick={calculateWeightsFromMarketCap}
            disabled={!totalInvestment || selectedTokens.size === 0 || isCalculating || isLoading}
            className="w-full"
          >
            {isCalculating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculating Weights...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Weights from Market Cap
              </>
            )}
          </Button>

          {/* Calculated Weights Display */}
          {tokensWithWeights.length > 0 && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-3">
                  Calculated Token Allocations
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Investment</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokensWithWeights.map((token) => (
                      <TableRow key={token.tokenId}>
                        <TableCell className="font-medium">
                          {token.symbol || 'Token'} (ID: {token.tokenId})
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {token.calculatedWeight} bp ({(token.calculatedWeight / 100).toFixed(2)}%)
                          </Badge>
                        </TableCell>
                        <TableCell>${token.investmentAmount.toFixed(2)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {token.calculatedAmount || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-3 pt-3 border-t border-green-300 dark:border-green-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700 dark:text-green-300">Total Weight:</span>
                    <span className="font-medium text-green-800 dark:text-green-200">
                      {tokensWithWeights.reduce((sum, t) => sum + t.calculatedWeight, 0)} bp
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleBulkAddTokens}
                disabled={isLoading || addTokenHoldingTx.inBestBlockProgress}
                className="w-full"
                size="lg"
              >
                {isLoading || addTokenHoldingTx.inBestBlockProgress ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding Tokens...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add All {tokensWithWeights.length} Tokens to Portfolio
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Token Entry (Fallback) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Manual Token Entry (Advanced)
          </CardTitle>
          <CardDescription>
            Manually add tokens with custom weights (use automatic calculation above for market cap-based weights)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Weight Allocation Status */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Weight Allocation</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                {totalWeightUsed.toLocaleString()} / 10,000 bp
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(totalWeightUsed / 10000) * 100}%` }}
              />
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Remaining capacity: {remainingWeight.toLocaleString()} basis points ({((remainingWeight / 10000) * 100).toFixed(2)}%)
            </div>
            {remainingWeightQuery.isLoading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remainingWeightQuery.refresh()}
                className="mt-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            )}
          </div>

          {/* Registered Tokens List */}
          {registeredTokens.length > 0 && (
            <div className="space-y-2">
              <Label>Available Registered Tokens</Label>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg max-h-40 overflow-y-auto">
                {isLoadingTokens ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-500">Loading tokens...</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {registeredTokens.map((token) => (
                      <button
                        key={token.tokenId}
                        onClick={() => setTokenId(token.tokenId.toString())}
                        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded text-sm transition-colors"
                        title={`${token.name || 'Token'} (${token.contractAddress.slice(0, 10)}...)`}
                      >
                        {token.symbol || 'Token'} (ID: {token.tokenId})
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Click a token to select it. These are tokens registered in the Registry contract.
              </p>
            </div>
          )}

          {/* Add Token Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="tokenId"
                  helpText="The token ID from the Registry contract. This is the unique identifier assigned when the token was registered. You can find token IDs in the Registry Info tab or click on a token above to auto-fill this field."
                >
                  Token ID *
                </LabelWithHelp>
                <Input
                  id="tokenId"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  placeholder="e.g., 1, 2, 3..."
                  type="number"
                  min="1"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="amount"
                  helpText="The initial amount of tokens to add to the portfolio. Enter the amount in the token's native units (e.g., if the token has 18 decimals, enter 1000000000000000000 for 1 token). This represents the starting balance for this token in the portfolio."
                >
                  Initial Amount *
                </LabelWithHelp>
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 1000000000000000000"
                  type="number"
                  min="0"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="targetWeight"
                  helpText="Target weight in basis points (1 bp = 0.01%). Enter a value between 1 and 10000. For example: 4000 = 40%, 3000 = 30%, 2500 = 25%. Total weights across all tokens should equal 10000 (100%). The portfolio will rebalance to maintain these target weights."
                >
                  Target Weight (basis points) *
                </LabelWithHelp>
                <Input
                  id="targetWeight"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder="e.g., 4000 (for 40%)"
                  type="number"
                  min="1"
                  max="10000"
                  disabled={isLoading}
                />
                {targetWeight && !isNaN(parseInt(targetWeight)) && (
                  <p className="text-xs text-gray-500">
                    = {(parseInt(targetWeight) / 100).toFixed(2)}%
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={handleAddToken}
              disabled={!tokenId || !amount || !targetWeight || isLoading || addTokenHoldingTx.inBestBlockProgress}
              className="w-full"
            >
              {isLoading || addTokenHoldingTx.inBestBlockProgress ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Token...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Token to Portfolio
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {result && result.type === 'addToken' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Token {result.tokenId} added successfully with {result.weight} basis points ({(result.weight / 100).toFixed(2)}%) target weight
              </AlertDescription>
            </Alert>
          )}

          {result && result.type === 'bulkAdd' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Successfully added {result.count} tokens to the portfolio with market cap-based weights
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Initialize Base Portfolio Value */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Initialize Base Portfolio Value
          </CardTitle>
          <CardDescription>
            Set the $100 baseline for performance tracking (Phase 4.2) - This can only be done once!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Critical:</strong> This sets the immutable baseline for performance tracking. 
              Make sure the portfolio has actual token holdings before calling this. This action cannot be undone.
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              What this does:
            </h4>
            <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside mb-3">
              <li>Locks in the current portfolio value as the baseline ($100)</li>
              <li>Enables performance tracking and index value calculations</li>
              <li>Should be called after adding initial tokens to the portfolio</li>
            </ul>
            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              Why only once?
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              The base portfolio value is used as an <strong>immutable reference point</strong> for calculating 
              performance metrics over time. If you could reset it, you would lose the ability to track 
              historical performance accurately. The index value formula is: 
              <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">Index Value = (Current Portfolio Value / Base Portfolio Value) × Base Index Value</code>. 
              Changing the base would invalidate all historical performance data and make comparisons meaningless.
            </p>
          </div>

          <Button
            onClick={handleInitializeBaseValue}
            disabled={isLoading || initializeBaseValueTx.inBestBlockProgress}
            variant="outline"
            className="w-full"
          >
            {isLoading || initializeBaseValueTx.inBestBlockProgress ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Initialize Base Portfolio Value
              </>
            )}
          </Button>

          {result && result.type === 'initializeBaseValue' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                {result.message || 'Base portfolio value initialized successfully'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
