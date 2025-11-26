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
import { CheckCircle, XCircle, Plus, Wallet, Loader2, RefreshCw, AlertTriangle, Target } from 'lucide-react';
import { LabelWithHelp } from '@/components/ui/field-help';
import { txToaster } from '@/utils/txToaster';
import { getDeployedToken, DEPLOYED_TOKENS } from '@/lib/token-deployments';

interface RegisteredToken {
  tokenId: number;
  symbol?: string;
  name?: string;
  contractAddress: string;
}

export default function PortfolioTokenManager() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const { contract: registryContract } = useContract<RegistryContractApi>('registry');
  
  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
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

  // Load registered tokens from Registry
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
            const result = await registryContract.query.getBasicTokenData(id);
            if (!result.data) continue;

            let tokenData: any = null;
            if ('isOk' in result.data && result.data.isOk) {
              tokenData = result.data.value;
            } else if ('isErr' in result.data && result.data.isErr) {
              continue;
            } else {
              tokenData = result.data;
            }

            if (!tokenData) continue;

            // Extract contract address
            let contractAddress: string = 'Unknown';
            if (tokenData.tokenContract) {
              if (typeof tokenData.tokenContract === 'string') {
                contractAddress = tokenData.tokenContract;
              } else if (typeof (tokenData.tokenContract as any)?.address === 'function') {
                contractAddress = (tokenData.tokenContract as any).address();
              } else if (typeof (tokenData.tokenContract as any)?.toString === 'function') {
                contractAddress = (tokenData.tokenContract as any).toString();
              } else {
                contractAddress = String(tokenData.tokenContract);
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
      {/* Add Token to Portfolio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Token to Portfolio
          </CardTitle>
          <CardDescription>
            Add registered tokens to the portfolio with target weights (Phase 4.1)
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
            <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
              <li>Locks in the current portfolio value as the baseline ($100)</li>
              <li>Enables performance tracking and index value calculations</li>
              <li>Can only be executed once - make sure you're ready!</li>
              <li>Should be called after adding initial tokens to the portfolio</li>
            </ul>
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
