// src/components/token/token-viewer.tsx

'use client';

import { useState } from 'react';
import { useContract, useContractQuery } from 'typink';
import type { TokenContractApi } from '@/lib/contracts/token';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddressInput } from '@/components/address-input.dedot';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Coins, Users, TrendingUp, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface QueryState {
    type: 'idle' | 'pending' | 'success' | 'error';
    message?: string;
    data?: any;
}

export function TokenViewer() {
    const { contract: tokenContract } = useContract<TokenContractApi>('token');

    const [accountAddress, setAccountAddress] = useState<string>('');
    const [spenderAddress, setSpenderAddress] = useState<string>('');
    const [queryType, setQueryType] = useState<'supply' | 'balance' | 'allowance' | 'metadata'>('supply');
    const [queryState, setQueryState] = useState<QueryState>({ type: 'idle' });

    // Use Typink hooks for contract queries
    const totalSupplyQuery = useContractQuery({
        contract: tokenContract,
        fn: 'psp22TotalSupply'
    });

    const balanceQuery = useContractQuery({
        contract: tokenContract,
        fn: 'psp22BalanceOf',
        args: accountAddress ? [accountAddress as `0x${string}`] : ['0x0000000000000000000000000000000000000000000000000000000000000000']
    });

    const allowanceQuery = useContractQuery({
        contract: tokenContract,
        fn: 'psp22Allowance',
        args: (accountAddress && spenderAddress) ? [accountAddress as `0x${string}`, spenderAddress as `0x${string}`] : ['0x0000000000000000000000000000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000000000000000000000000000']
    });

    const nameQuery = useContractQuery({
        contract: tokenContract,
        fn: 'psp22MetadataTokenName'
    });

    const symbolQuery = useContractQuery({
        contract: tokenContract,
        fn: 'psp22MetadataTokenSymbol'
    });

    const decimalsQuery = useContractQuery({
        contract: tokenContract,
        fn: 'psp22MetadataTokenDecimals'
    });

    const resetQuery = () => {
        setQueryState({ type: 'idle' });
    };

    const handleGetTotalSupply = async () => {
        await totalSupplyQuery.refresh();
        if (totalSupplyQuery.data) {
            const supply = Number(totalSupplyQuery.data);
            setQueryState({
                type: 'success',
                message: `Total supply: ${(supply / 10 ** 12).toFixed(4)} tokens`,
                data: { type: 'supply', supply }
            });
        }
    };

    const handleGetBalance = async () => {
        if (!accountAddress.trim()) {
            setQueryState({ type: 'error', message: 'Please enter a valid account address' });
            return;
        }

        await balanceQuery.refresh();
        if (balanceQuery.data) {
            const balance = Number(balanceQuery.data);
            setQueryState({
                type: 'success',
                message: `Balance: ${(balance / 10 ** 12).toFixed(4)} tokens`,
                data: { type: 'balance', balance, account: accountAddress.trim() }
            });
        }
    };

    const handleGetAllowance = async () => {
        if (!accountAddress.trim() || !spenderAddress.trim()) {
            setQueryState({ type: 'error', message: 'Please enter valid owner and spender addresses' });
            return;
        }

        await allowanceQuery.refresh();
        if (allowanceQuery.data) {
            const allowance = Number(allowanceQuery.data);
            setQueryState({
                type: 'success',
                message: `Allowance: ${(allowance / 10 ** 12).toFixed(4)} tokens`,
                data: {
                    type: 'allowance',
                    allowance,
                    owner: accountAddress.trim(),
                    spender: spenderAddress.trim()
                }
            });
        }
    };

    const handleGetMetadata = async () => {
        await Promise.all([
            nameQuery.refresh(),
            symbolQuery.refresh(),
            decimalsQuery.refresh()
        ]);

        if (nameQuery.data && symbolQuery.data && decimalsQuery.data) {
            const metadata = {
                name: nameQuery.data,
                symbol: symbolQuery.data,
                decimals: Number(decimalsQuery.data)
            };

            setQueryState({
                type: 'success',
                message: `Token metadata retrieved`,
                data: { type: 'metadata', metadata }
            });
        }
    };

    const executeQuery = () => {
        switch (queryType) {
            case 'supply':
                return handleGetTotalSupply();
            case 'balance':
                return handleGetBalance();
            case 'allowance':
                return handleGetAllowance();
            case 'metadata':
                return handleGetMetadata();
        }
    };

    const getStateIcon = () => {
        switch (queryState.type) {
            case 'pending':
                return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return null;
        }
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 8)}...${address.slice(-8)}`;
    };

    return (
        <Card className="w-full shadow-none mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Coins className="h-5 w-5" />
                    <span>Token Query</span>
                </CardTitle>
                <CardDescription>
                    Query token balances, allowances, and metadata
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Query Type Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Query Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                            { value: 'supply', label: 'Total Supply', icon: TrendingUp },
                            { value: 'balance', label: 'Balance', icon: Coins },
                            { value: 'allowance', label: 'Allowance', icon: Users },
                            { value: 'metadata', label: 'Metadata', icon: Search }
                        ].map(({ value, label, icon: Icon }) => (
                            <label key={value} className="flex items-center space-x-2 cursor-pointer p-2 rounded border hover:bg-gray-50 dark:hover:bg-gray-800">
                                <input
                                    type="radio"
                                    name="queryType"
                                    value={value}
                                    checked={queryType === value}
                                    onChange={(e) => {
                                        setQueryType(e.target.value as any);
                                        resetQuery();
                                    }}
                                    className="text-primary focus:ring-primary"
                                />
                                <Icon className="h-3 w-3" />
                                <span className="text-xs">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-4">
                    {queryType === 'balance' && (
                        <div className="space-y-2">
                            <label htmlFor="accountAddress" className="text-sm font-medium">
                                Account Address
                            </label>
                            <AddressInput
                                placeholder="Enter account address"
                                value={accountAddress}
                                onChange={(value) => {
                                    setAccountAddress(value);
                                    resetQuery();
                                }}
                                className="font-mono text-sm"
                                disabled={queryState.type === 'pending'}
                            />
                        </div>
                    )}

                    {queryType === 'allowance' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="ownerAddress" className="text-sm font-medium">
                                    Owner Address
                                </label>
                                <Input
                                    id="ownerAddress"
                                    placeholder="Enter owner address"
                                    value={accountAddress}
                                    onChange={(e) => {
                                        setAccountAddress(e.target.value);
                                        resetQuery();
                                    }}
                                    className="font-mono text-sm"
                                    disabled={queryState.type === 'pending'}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="spenderAddress" className="text-sm font-medium">
                                    Spender Address
                                </label>
                                <Input
                                    id="spenderAddress"
                                    placeholder="Enter spender address"
                                    value={spenderAddress}
                                    onChange={(e) => {
                                        setSpenderAddress(e.target.value);
                                        resetQuery();
                                    }}
                                    className="font-mono text-sm"
                                    disabled={queryState.type === 'pending'}
                                />
                            </div>
                        </div>
                    )}

                    {/* Query Button */}
                    <Button
                        onClick={executeQuery}
                        disabled={
                            queryState.type === 'pending' ||
                            !tokenContract ||
                            (queryType === 'balance' && !accountAddress.trim()) ||
                            (queryType === 'allowance' && (!accountAddress.trim() || !spenderAddress.trim()))
                        }
                        className="w-full"
                    >
                        {queryState.type === 'pending' ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Search className="h-4 w-4 mr-2" />
                        )}
                        {queryState.type === 'pending'
                            ? 'Querying...'
                            : {
                                supply: 'Get Total Supply',
                                balance: 'Get Balance',
                                allowance: 'Get Allowance',
                                metadata: 'Get Metadata'
                            }[queryType]
                        }
                    </Button>
                </div>

                {/* Status Message */}
                {queryState.type !== 'idle' && (
                    <div className={`p-4 rounded-lg border flex items-start space-x-3 ${queryState.type === 'pending'
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                        : queryState.type === 'success'
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        }`}>
                        {getStateIcon()}
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${queryState.type === 'pending'
                                ? 'text-blue-800 dark:text-blue-200'
                                : queryState.type === 'success'
                                    ? 'text-green-800 dark:text-green-200'
                                    : 'text-red-800 dark:text-red-200'
                                }`}>
                                {queryState.message}
                            </p>
                        </div>
                    </div>
                )}

                {/* Results Display */}
                {queryState.type === 'success' && queryState.data && (
                    <div className="space-y-4">
                        {/* Total Supply Result */}
                        {queryState.data.type === 'supply' && (
                            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-purple-900 dark:text-purple-100">
                                        {(Number(queryState.data.supply) / 10 ** 12).toLocaleString()}
                                    </div>
                                    <div className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                                        Total Token Supply
                                    </div>
                                    <div className="text-xs text-purple-500 dark:text-purple-400 mt-2">
                                        Raw: {queryState.data.supply.toString()}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Balance Result */}
                        {queryState.data.type === 'balance' && (
                            <div className="space-y-3">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Account</div>
                                    <div className="text-xs font-mono text-blue-900 dark:text-blue-100 break-all">
                                        {queryState.data.account}
                                    </div>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="text-lg font-bold text-green-900 dark:text-green-100">
                                        Balance: {(Number(queryState.data.balance) / 10 ** 12).toLocaleString()} tokens
                                    </div>
                                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                        Raw: {queryState.data.balance.toString()}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Allowance Result */}
                        {queryState.data.type === 'allowance' && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Owner</div>
                                        <div className="text-xs font-mono text-blue-900 dark:text-blue-100 break-all">
                                            {formatAddress(queryState.data.owner)}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                        <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">Spender</div>
                                        <div className="text-xs font-mono text-purple-900 dark:text-purple-100 break-all">
                                            {formatAddress(queryState.data.spender)}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="text-lg font-bold text-green-900 dark:text-green-100">
                                        Allowance: {(Number(queryState.data.allowance) / 10 ** 12).toLocaleString()} tokens
                                    </div>
                                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                        Raw: {queryState.data.allowance.toString()}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Metadata Result */}
                        {queryState.data.type === 'metadata' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Name</div>
                                    <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                        {queryState.data.metadata.name || 'Not set'}
                                    </div>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">Symbol</div>
                                    <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                        {queryState.data.metadata.symbol || 'Not set'}
                                    </div>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">Decimals</div>
                                    <div className="text-lg font-bold text-green-900 dark:text-green-100">
                                        {queryState.data.metadata.decimals}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Contract Status */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Token Contract:</span>
                        <span className={`flex items-center space-x-2 ${tokenContract ? 'text-green-600' : 'text-red-600'}`}>
                            <div className={`w-2 h-2 rounded-full ${tokenContract ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span>{tokenContract ? 'Connected' : 'Not Available'}</span>
                        </span>
                    </div>

                    {!tokenContract && (
                        <div className="flex items-center space-x-2 text-xs text-amber-600 mt-2">
                            <AlertCircle className="h-3 w-3" />
                            <span>Make sure your wallet is connected and token contract is deployed</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}