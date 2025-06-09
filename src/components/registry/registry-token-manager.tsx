// src/components/registry/registry-token-manager.tsx

'use client';

import { useState } from 'react';
import { useContract, useContractTx } from 'typink';
import { ContractId } from '@/contracts/deployments';
import type { RegistryContractApi } from '@/contracts/types/registry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Package, DollarSign, TrendingUp, Layers } from 'lucide-react';
import { txToaster } from '@/utils/txToaster';

export function RegistryTokenManager() {
    const { contract: registryContract } = useContract<RegistryContractApi>(ContractId.REGISTRY);
    const [tokenContract, setTokenContract] = useState<string>('');
    const [oracleContract, setOracleContract] = useState<string>('');
    const [updateTokenId, setUpdateTokenId] = useState<string>('');
    const [balance, setBalance] = useState<string>('');
    const [weightInvestment, setWeightInvestment] = useState<string>('');
    const [tier, setTier] = useState<string>('');
    const [managementType, setManagementType] = useState<'add' | 'update'>('add');
    const [error, setError] = useState<string | null>(null);

    const addTokenTx = useContractTx(registryContract, 'addToken');
    const updateTokenTx = useContractTx(registryContract, 'updateToken');

    const handleAddToken = async () => {
        if (!registryContract || !tokenContract.trim() || !oracleContract.trim()) {
            setError('Please enter valid token and oracle contract addresses');
            return;
        }

        setError(null);
        const toaster = txToaster('Adding new token to registry...');

        try {
            toaster.onTxPending();

            await addTokenTx.signAndSend({
                args: [tokenContract.trim(), oracleContract.trim()],
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded' && !progress.dispatchError) {
                        setTokenContract('');
                        setOracleContract('');
                    }
                }
            });
        } catch (err) {
            console.error('Add token error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const handleUpdateToken = async () => {
        if (!registryContract || !updateTokenId.trim() || !balance || !weightInvestment || !tier) {
            setError('Please fill in all fields for token update');
            return;
        }

        // Validate input values
        if (isNaN(Number(updateTokenId)) || Number(updateTokenId) <= 0) {
            setError('Token ID must be a positive number');
            return;
        }
        if (isNaN(Number(balance)) || Number(balance) < 0) {
            setError('Balance must be a non-negative number');
            return;
        }
        if (isNaN(Number(weightInvestment)) || Number(weightInvestment) < 0) {
            setError('Weight investment must be a non-negative number');
            return;
        }
        if (isNaN(Number(tier)) || Number(tier) < 0) {
            setError('Tier must be a non-negative number');
            return;
        }

        setError(null);
        const toaster = txToaster('Updating token data...');

        try {
            const tokenId = parseInt(updateTokenId);
            const balanceInPlancks = BigInt(Math.floor(Number(balance) * 10 ** 10));
            const weightInvestmentNum = parseInt(weightInvestment);
            const tierNum = parseInt(tier);

            toaster.onTxPending();

            await updateTokenTx.signAndSend({
                args: [tokenId, balanceInPlancks, weightInvestmentNum, tierNum],
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded' && !progress.dispatchError) {
                        setUpdateTokenId('');
                        setBalance('');
                        setWeightInvestment('');
                        setTier('');
                    }
                }
            });
        } catch (err) {
            console.error('Update token error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const isLoading = addTokenTx.inBestBlockProgress || updateTokenTx.inBestBlockProgress;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Token Management</span>
                </CardTitle>
                <CardDescription>
                    Add new tokens and update existing token data (owner only)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Management Type Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Management Type</label>
                    <div className="flex space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="managementType"
                                value="add"
                                checked={managementType === 'add'}
                                onChange={(e) => setManagementType(e.target.value as 'add')}
                                className="text-primary focus:ring-primary"
                                disabled={isLoading}
                            />
                            <span className="text-sm">Add New Token</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="managementType"
                                value="update"
                                checked={managementType === 'update'}
                                onChange={(e) => setManagementType(e.target.value as 'update')}
                                className="text-primary focus:ring-primary"
                                disabled={isLoading}
                            />
                            <span className="text-sm">Update Existing Token</span>
                        </label>
                    </div>
                </div>

                {/* Add Token Form */}
                {managementType === 'add' && (
                    <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center space-x-2">
                            <Plus className="h-4 w-4" />
                            <span>Add New Token</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="tokenContract" className="text-sm font-medium">
                                    Token Contract Address *
                                </label>
                                <Input
                                    id="tokenContract"
                                    placeholder="Enter token contract address"
                                    value={tokenContract}
                                    onChange={(e) => setTokenContract(e.target.value)}
                                    className="font-mono text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="oracleContract" className="text-sm font-medium">
                                    Oracle Contract Address *
                                </label>
                                <Input
                                    id="oracleContract"
                                    placeholder="Enter oracle contract address"
                                    value={oracleContract}
                                    onChange={(e) => setOracleContract(e.target.value)}
                                    className="font-mono text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded border border-green-300 dark:border-green-700">
                            <p className="text-xs text-green-800 dark:text-green-200">
                                📦 <strong>Add Token:</strong> Registers a new token with its associated oracle contract. Initial balance, weight, and tier will be set to 0.
                            </p>
                        </div>
                        <Button
                            onClick={handleAddToken}
                            disabled={!registryContract || !tokenContract.trim() || !oracleContract.trim() || isLoading}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {isLoading ? 'Adding Token...' : 'Add Token to Registry'}
                        </Button>
                    </div>
                )}

                {/* Update Token Form */}
                {managementType === 'update' && (
                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center space-x-2">
                            <Edit className="h-4 w-4" />
                            <span>Update Token Data</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="updateTokenId" className="text-sm font-medium">
                                    Token ID *
                                </label>
                                <Input
                                    id="updateTokenId"
                                    type="number"
                                    min="1"
                                    placeholder="Enter token ID"
                                    value={updateTokenId}
                                    onChange={(e) => setUpdateTokenId(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="balance" className="text-sm font-medium">
                                        Balance (PAS) *
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="balance"
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            placeholder="e.g., 100.5"
                                            value={balance}
                                            onChange={(e) => setBalance(e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="weightInvestment" className="text-sm font-medium">
                                        Weight Investment *
                                    </label>
                                    <div className="relative">
                                        <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="weightInvestment"
                                            type="number"
                                            min="0"
                                            placeholder="e.g., 25"
                                            value={weightInvestment}
                                            onChange={(e) => setWeightInvestment(e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="tier" className="text-sm font-medium">
                                        Tier *
                                    </label>
                                    <div className="relative">
                                        <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="tier"
                                            type="number"
                                            min="0"
                                            placeholder="e.g., 1"
                                            value={tier}
                                            onChange={(e) => setTier(e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300 dark:border-blue-700">
                            <p className="text-xs text-blue-800 dark:text-blue-200">
                                📝 <strong>Update Token:</strong> Modify balance, weight investment, and tier for an existing registered token.
                            </p>
                        </div>
                        <Button
                            onClick={handleUpdateToken}
                            disabled={!registryContract || !updateTokenId || !balance || !weightInvestment || !tier || isLoading}
                            className="w-full"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            {isLoading ? 'Updating Token...' : 'Update Token Data'}
                        </Button>
                    </div>
                )}

                {/* Quick Fill Options for Update */}
                {managementType === 'update' && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                            Quick Fill Sample Data
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Button
                                onClick={() => {
                                    setBalance('50.25');
                                    setWeightInvestment('10');
                                    setTier('1');
                                }}
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                            >
                                Tier 1 Token
                            </Button>
                            <Button
                                onClick={() => {
                                    setBalance('150.75');
                                    setWeightInvestment('25');
                                    setTier('2');
                                }}
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                            >
                                Tier 2 Token
                            </Button>
                            <Button
                                onClick={() => {
                                    setBalance('500.00');
                                    setWeightInvestment('50');
                                    setTier('3');
                                }}
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                            >
                                Tier 3 Token
                            </Button>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            Click to fill the form with sample token data
                        </p>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}