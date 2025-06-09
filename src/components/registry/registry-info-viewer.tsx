// src/components/registry/registry-info-viewer.tsx

'use client';

import { useState, useEffect } from 'react';
import { useContract } from 'typink';
import { ContractId } from '@/contracts/deployments';
import type { RegistryContractApi } from '@/contracts/types/registry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, User, Package, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

export function RegistryInfoViewer() {
    const { contract: registryContract } = useContract<RegistryContractApi>(ContractId.REGISTRY);
    const [checkTokenId, setCheckTokenId] = useState<string>('');
    const [owner, setOwner] = useState<string | null>(null);
    const [tokenCount, setTokenCount] = useState<number | null>(null);
    const [tokenExists, setTokenExists] = useState<boolean | null>(null);
    const [checkedTokenId, setCheckedTokenId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadRegistryInfo = async () => {
        if (!registryContract) return;

        setIsLoading(true);
        setError(null);
        try {
            // Load owner
            const ownerResult = await registryContract.query.getOwner();
            setOwner(ownerResult.data.address());

            // Load token count
            const countResult = await registryContract.query.getTokenCount();
            setTokenCount(countResult.data || 0);

        } catch (err) {
            console.error('Error loading registry info:', err);
            setError(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckTokenExists = async () => {
        if (!registryContract || !checkTokenId.trim()) {
            setError('Please enter a valid token ID');
            return;
        }

        setIsLoading(true);
        setError(null);
        setTokenExists(null);
        try {
            const tokenIdNum = parseInt(checkTokenId);
            if (isNaN(tokenIdNum) || tokenIdNum <= 0) {
                setError('Token ID must be a positive number');
                return;
            }

            const result = await registryContract.query.tokenExists(tokenIdNum);
            setTokenExists(result.data || false);
            setCheckedTokenId(checkTokenId);
        } catch (err) {
            console.error('Error checking token existence:', err);
            setError(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Load info on component mount and when contract becomes available
    useEffect(() => {
        loadRegistryInfo();
    }, [registryContract]);

    const formatAddress = (address: string) => {
        return `${address.slice(0, 8)}...${address.slice(-8)}`;
    };

    return (
        <div className="space-y-6">
            {/* Registry General Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Info className="h-5 w-5" />
                        <span>Registry Information</span>
                    </CardTitle>
                    <CardDescription>
                        View registry contract details and token statistics
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-between items-center">
                        <Button
                            onClick={loadRegistryInfo}
                            disabled={!registryContract || isLoading}
                            variant="outline"
                            size="sm"
                        >
                            {isLoading ? (
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Refresh Info
                        </Button>
                    </div>

                    {/* Contract Owner */}
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200 flex items-center space-x-2 mb-3">
                            <User className="h-4 w-4" />
                            <span>Contract Owner</span>
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Owner Address:</span>
                                <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                                    {owner ? formatAddress(owner) : 'Loading...'}
                                </span>
                            </div>
                            {owner && (
                                <div className="text-xs text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                    Full: {owner}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Token Statistics */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center space-x-2 mb-3">
                            <Package className="h-4 w-4" />
                            <span>Token Registry Statistics</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                                    {tokenCount !== null ? tokenCount : '...'}
                                </div>
                                <div className="text-sm text-blue-600 dark:text-blue-400">
                                    Total Registered Tokens
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                                    {tokenCount !== null ? (tokenCount > 0 ? tokenCount : 0) : '...'}
                                </div>
                                <div className="text-sm text-blue-600 dark:text-blue-400">
                                    Available Token IDs: 1-{tokenCount || 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Token Existence Checker */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>Token Existence Checker</span>
                    </CardTitle>
                    <CardDescription>
                        Check if a specific token ID is registered in the system
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Token ID Input */}
                    <div className="space-y-2">
                        <label htmlFor="checkTokenId" className="text-sm font-medium">
                            Token ID to Check
                        </label>
                        <Input
                            id="checkTokenId"
                            type="number"
                            min="1"
                            placeholder="Enter token ID to check existence"
                            value={checkTokenId}
                            onChange={(e) => setCheckTokenId(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                            Enter a token ID to verify if it exists in the registry
                        </p>
                    </div>

                    <Button
                        onClick={handleCheckTokenExists}
                        disabled={!registryContract || !checkTokenId.trim() || isLoading}
                        className="w-full"
                    >
                        {isLoading ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Check Token Existence
                    </Button>

                    {/* Existence Result */}
                    {tokenExists !== null && checkedTokenId && (
                        <div className="space-y-3">
                            <div className={`p-4 rounded-lg border ${tokenExists
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                }`}>
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className={`h-4 w-4 ${tokenExists ? 'text-green-600' : 'text-gray-500'}`} />
                                    <span className={`text-sm font-medium ${tokenExists
                                        ? 'text-green-800 dark:text-green-200'
                                        : 'text-gray-700 dark:text-gray-300'
                                        }`}>
                                        Token ID {checkedTokenId}: {tokenExists ? 'EXISTS' : 'NOT FOUND'}
                                    </span>
                                </div>
                                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                    {tokenExists
                                        ? 'This token is registered and can be queried for data'
                                        : 'This token ID has not been registered yet'
                                    }
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contract Status */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Registry Contract:</span>
                                <span className={`flex items-center space-x-2 ${registryContract ? 'text-green-600' : 'text-red-600'}`}>
                                    <div className={`w-2 h-2 rounded-full ${registryContract ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span>{registryContract ? 'Connected' : 'Not Available'}</span>
                                </span>
                            </div>

                            {!registryContract && (
                                <div className="flex items-center space-x-2 text-xs text-amber-600">
                                    <AlertCircle className="h-3 w-3" />
                                    <span>Make sure your wallet is connected and registry contract is deployed</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}