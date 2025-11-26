'use client';

import { useState } from 'react';
import { useContract, useContractTx, useContractQuery } from 'typink';
import type { StakingContractApi } from '@/lib/contracts/staking';
import { CONTRACT_ADDRESSES } from '@/providers/TypinkProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Settings, Clock, RefreshCw, Copy, Wallet } from 'lucide-react';

export default function StakingConfiguration() {
  const { contract: stakingContract } = useContract<StakingContractApi>('staking');
  const [stakingPeriod, setStakingPeriod] = useState('');
  const [unstakingPeriod, setUnstakingPeriod] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Contract reference configuration state
  const [w3piTokenAddress, setW3piTokenAddress] = useState<string>(CONTRACT_ADDRESSES.TOKEN);
  const [registryAddress, setRegistryAddress] = useState<string>(CONTRACT_ADDRESSES.REGISTRY);
  const [feeWalletAddress, setFeeWalletAddress] = useState<string>('5Dc2AZgBtFERxPqVxhxMfmeKQt8BMfxSeMyxQCyCxqy35e1a');

  // Transaction hooks
  // Note: Some methods don't exist in Staking contract API
  // const setStakingPeriodTx = useContractTx(stakingContract, 'setStakingPeriod');
  // const setUnstakingPeriodTx = useContractTx(stakingContract, 'setUnstakingPeriod');
  const pauseTx = useContractTx(stakingContract, 'pause');
  const resumeTx = useContractTx(stakingContract, 'unpause');
  const setW3piTokenTx = useContractTx(stakingContract, 'setW3piToken');
  const setRegistryTx = useContractTx(stakingContract, 'setRegistry');
  const setFeeWalletTx = useContractTx(stakingContract, 'setFeeWallet');

  // State for staking configuration
  // Note: These methods don't exist in Staking contract API
  const [currentStakingPeriod, setCurrentStakingPeriod] = useState<any>(null);
  const [currentUnstakingPeriod, setCurrentUnstakingPeriod] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Note: isPaused method doesn't exist in Staking contract API
  // const [isPaused, setIsPaused] = useState<any>(null);

  // Note: These methods don't exist in Staking contract API
  // const handleSetStakingPeriod = async () => {
  //   if (!stakingPeriod) {
  //     setError('Please enter a staking period');
  //     return;
  //   }

  //   setIsLoading(true);
  //   setError(null);
  //   setResult(null);

  //   try {
  //     const tx = setStakingPeriodTx.tx(BigInt(stakingPeriod));
  //     const hash = await tx.signAndSend(selectedAccount?.address);
  //     setResult({ type: 'setStakingPeriod', hash, period: stakingPeriod });
  //   } catch (err: any) {
  //     setError(`Error setting staking period: ${err.message}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleSetUnstakingPeriod = async () => {
  //   if (!unstakingPeriod) {
  //     setError('Please enter an unstaking period');
  //     return;
  //   }

  //   setIsLoading(true);
  //   setError(null);
  //   setResult(null);

  //   try {
  //     const tx = setUnstakingPeriodTx.tx(BigInt(unstakingPeriod));
  //     const hash = await tx.signAndSend(selectedAccount?.address);
  //     setResult({ type: 'setUnstakingPeriod', hash, period: unstakingPeriod });
  //   } catch (err: any) {
  //     setError(`Error setting unstaking period: ${err.message}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handlePause = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      await pauseTx.signAndSend({
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setResult({ type: 'pause', hash: 'success' });
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error pausing staking: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      await resumeTx.signAndSend({
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setResult({ type: 'resume', hash: 'success' });
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error resuming staking: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPeriod = (period: bigint) => {
    const days = Number(period) / (24 * 60 * 60);
    return `${days.toFixed(1)} days`;
  };

  // Helper function to validate H160 address
  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Helper function to copy address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Address copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  // Handle setting W3PI token address
  const handleSetW3piToken = async () => {
    if (!isValidAddress(w3piTokenAddress)) {
      setError('Invalid W3PI token contract address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await setW3piTokenTx.signAndSend({
        args: [w3piTokenAddress as `0x${string}`],
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setSuccess('W3PI token address set successfully!');
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error setting W3PI token address: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle setting Registry address
  const handleSetRegistry = async () => {
    if (!isValidAddress(registryAddress)) {
      setError('Invalid Registry contract address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await setRegistryTx.signAndSend({
        args: [registryAddress as `0x${string}`],
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setSuccess('Registry address set successfully!');
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error setting Registry address: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle setting Fee Wallet address
  const handleSetFeeWallet = async () => {
    if (!isValidAddress(feeWalletAddress)) {
      setError('Invalid fee wallet address. Must be H160 format (0x followed by 40 hex characters)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await setFeeWalletTx.signAndSend({
        args: [feeWalletAddress as `0x${string}`],
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setSuccess('Fee wallet address set successfully!');
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error setting fee wallet address: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Staking Configuration
          </CardTitle>
          <CardDescription>
            Configure staking parameters and system settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Current Staking Period</Label>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {currentStakingPeriod ? formatPeriod(currentStakingPeriod) : 'Loading...'}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Current Unstaking Period</Label>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-xl font-bold text-orange-600">
                  {currentUnstakingPeriod ? formatPeriod(currentUnstakingPeriod) : 'Loading...'}
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="space-y-2">
            <Label>System Status</Label>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                {/* {isPaused ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )} */}
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">
                  {/* {isPaused ? 'Paused' : 'Active'} */}
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Set Staking Period */}
          <div className="space-y-4">
            <h3 className="font-medium">Set Staking Period</h3>
            <div className="space-y-2">
              <Label>Staking Period (seconds)</Label>
              <Input
                value={stakingPeriod}
                onChange={(e) => setStakingPeriod(e.target.value)}
                placeholder="Enter staking period in seconds"
                type="number"
              />
            </div>
            {/* Note: setStakingPeriod method doesn't exist in Staking contract API */}
            {/* <Button
              onClick={handleSetStakingPeriod}
              disabled={!stakingPeriod || isLoading}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Set Staking Period
            </Button> */}
          </div>

          {/* Set Unstaking Period */}
          <div className="space-y-4">
            <h3 className="font-medium">Set Unstaking Period</h3>
            <div className="space-y-2">
              <Label>Unstaking Period (seconds)</Label>
              <Input
                value={unstakingPeriod}
                onChange={(e) => setUnstakingPeriod(e.target.value)}
                placeholder="Enter unstaking period in seconds"
                type="number"
              />
            </div>
            {/* Note: setUnstakingPeriod method doesn't exist in Staking contract API */}
            {/* <Button
              onClick={handleSetUnstakingPeriod}
              disabled={!unstakingPeriod || isLoading}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Set Unstaking Period
            </Button> */}
          </div>

          {/* System Controls */}
          <div className="space-y-4">
            <h3 className="font-medium">System Controls</h3>
            <div className="flex gap-2">
              <Button
                onClick={handlePause}
                disabled={isLoading}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Pause System
              </Button>
              <Button
                onClick={handleResume}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Resume System
              </Button>
            </div>
          </div>

          {/* Results */}
          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                {result.type} transaction submitted: {result.hash}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Information */}
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Configuration:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Set minimum staking and unstaking periods</li>
              <li>Pause system for maintenance</li>
              <li>Resume normal operations when ready</li>
              <li>All changes require owner permissions</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Contract References Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Contract References Configuration
          </CardTitle>
          <CardDescription>
            Configure contract references for Staking contract. These references enable cross-contract calls.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Set W3PI Token Address */}
          <div className="space-y-2">
            <Label htmlFor="w3pi-token-address">W3PI Token Contract Address</Label>
            <div className="flex gap-2">
              <Input
                id="w3pi-token-address"
                type="text"
                placeholder="0x..."
                value={w3piTokenAddress}
                onChange={(e) => setW3piTokenAddress(e.target.value)}
                className="font-mono"
              />
              <Button
                onClick={handleSetW3piToken}
                disabled={isLoading || !isValidAddress(w3piTokenAddress)}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Setting...
                  </>
                ) : (
                  'Set W3PI Token'
                )}
              </Button>
            </div>
          </div>

          {/* Set Registry Address */}
          <div className="space-y-2">
            <Label htmlFor="registry-address">Registry Contract Address</Label>
            <div className="flex gap-2">
              <Input
                id="registry-address"
                type="text"
                placeholder="0x..."
                value={registryAddress}
                onChange={(e) => setRegistryAddress(e.target.value)}
                className="font-mono"
              />
              <Button
                onClick={handleSetRegistry}
                disabled={isLoading || !isValidAddress(registryAddress)}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Setting...
                  </>
                ) : (
                  'Set Registry'
                )}
              </Button>
            </div>
          </div>

          {/* Set Fee Wallet Address */}
          <div className="space-y-2">
            <Label htmlFor="fee-wallet-address">Fee Wallet Address (H160 format)</Label>
            <div className="flex gap-2">
              <Input
                id="fee-wallet-address"
                type="text"
                placeholder="0x..."
                value={feeWalletAddress}
                onChange={(e) => setFeeWalletAddress(e.target.value)}
                className="font-mono"
              />
              <Button
                onClick={handleSetFeeWallet}
                disabled={isLoading || !isValidAddress(feeWalletAddress)}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Setting...
                  </>
                ) : (
                  'Set Fee Wallet'
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Note: Fee wallet must be in H160 format (0x followed by 40 hex characters). 
              If you have a Polkadot SS58 address, convert it to H160 format first.
            </p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Information */}
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 border-t pt-4">
            <p><strong>About Contract References:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>W3PI Token: The W3PI token contract for staking operations</li>
              <li>Registry: The Registry contract for token tier information</li>
              <li>Fee Wallet: Address where staking fees are collected</li>
              <li>All configuration requires owner permissions</li>
              <li>These references enable cross-contract calls between Staking and other contracts</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
