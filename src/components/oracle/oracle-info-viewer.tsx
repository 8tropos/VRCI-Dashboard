// src/components/oracle/oracle-info-viewer.tsx

'use client';

import { useState, useEffect } from 'react';
import { useContract, useContractQuery } from 'typink';
import type { OracleContractApi } from '@/lib/contracts/oracle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { encodeSs58AsFormat, isSameH160, ss58ToReviveH160 } from '@/lib/address';
import { Info, Clock, AlertCircle, RefreshCw, User } from 'lucide-react';

const SUBSTRATE_DEV_SS58_FORMAT = 42;
const POLKADOT_SS58_FORMAT = 0;
const ORACLE_NATIVE_OWNER_SS58 = '5FAAUGRrj9AFCYKFKZjS3fUMh4ntZFVrRvDTX2NjcQRr15da';
const ORACLE_NATIVE_OWNER_H160 = ss58ToReviveH160(ORACLE_NATIVE_OWNER_SS58);
const ORACLE_NATIVE_OWNER_SS58_VARIANTS = [
    {
        label: `Substrate dev SS58 (${SUBSTRATE_DEV_SS58_FORMAT})`,
        value: encodeSs58AsFormat(ORACLE_NATIVE_OWNER_SS58, SUBSTRATE_DEV_SS58_FORMAT),
        tone: 'slate' as const,
    },
    {
        label: `Polkadot SS58 (${POLKADOT_SS58_FORMAT})`,
        value: encodeSs58AsFormat(ORACLE_NATIVE_OWNER_SS58, POLKADOT_SS58_FORMAT),
        tone: 'slate' as const,
    },
];

type AddressDisplayRowProps = {
    label: string;
    value: string;
    tone: 'purple' | 'slate';
};

function AddressDisplayRow({ label, value, tone }: AddressDisplayRowProps) {
    const toneClassName = tone === 'purple'
        ? 'border-purple-200 bg-white/70 dark:border-purple-800 dark:bg-purple-950/30'
        : 'border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/40';

    const badgeClassName = tone === 'purple'
        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-200'
        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';

    return (
        <div className={`rounded-md border p-3 ${toneClassName}`}>
            <div className="mb-2 flex items-center justify-between gap-3">
                <span className={`rounded px-2 py-1 text-xs font-semibold ${badgeClassName}`}>
                    {label}
                </span>
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    {value.slice(0, 8)}...{value.slice(-8)}
                </span>
            </div>
            <div className="break-all rounded bg-gray-50 p-2 font-mono text-xs text-gray-800 dark:bg-gray-950/50 dark:text-gray-200">
                {value}
            </div>
        </div>
    );
}

export function OracleInfoViewer() {
    const [tokenAddress, setTokenAddress] = useState<string>('');

    // Use dummy token address for testing
    const dummyTokenAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
    const targetAddress = tokenAddress.trim() || dummyTokenAddress;

    // Get the contract instance
    const { contract: oracleContract } = useContract<OracleContractApi>('oracle');

    // Use Typink hooks for contract queries
    const validationConfigQuery = useContractQuery({
        contract: oracleContract,
        fn: 'getValidationConfig'
    });

    const ownerQuery = useContractQuery({
        contract: oracleContract,
        fn: 'getOwner'
    });

    const lastUpdateQuery = useContractQuery({
        contract: oracleContract,
        fn: 'getLastUpdateTime',
        args: [targetAddress]
    });

    const staleQuery = useContractQuery({
        contract: oracleContract,
        fn: 'isPriceStale',
        args: [targetAddress]
    });

    const loadOracleInfo = async () => {
        await Promise.all([
            validationConfigQuery.refresh(),
            ownerQuery.refresh(),
            lastUpdateQuery.refresh(),
            staleQuery.refresh()
        ]);
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 8)}...${address.slice(-8)}`;
    };

    // Safe BigInt conversion helper
    const safeBigIntToNumber = (value: any): number => {
        if (typeof value === 'bigint') {
            return Number(value);
        }
        if (typeof value === 'string') {
            return parseInt(value, 10);
        }
        return value;
    };

    const formatDuration = (seconds: any) => {
        const numSeconds = safeBigIntToNumber(seconds);
        if (numSeconds >= 3600) {
            return `${Math.floor(numSeconds / 3600)} hours`;
        } else if (numSeconds >= 60) {
            return `${Math.floor(numSeconds / 60)} minutes`;
        } else {
            return `${numSeconds} seconds`;
        }
    };

    // Extract data from Typink query results
    const configData = validationConfigQuery.data;
    const ownerData = ownerQuery.data;
    const ownerNativeSs58Variants = ownerData && isSameH160(ownerData, ORACLE_NATIVE_OWNER_H160)
        ? ORACLE_NATIVE_OWNER_SS58_VARIANTS
        : [];
    const lastUpdateData = lastUpdateQuery.data;
    const staleData = staleQuery.data;

    return (
        <div className="space-y-6">
            {/* Oracle General Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Info className="h-5 w-5" />
                        <span>Oracle Information</span>
                    </CardTitle>
                    <CardDescription>
                        View oracle configuration and contract details
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-between items-center">
                        <Button
                            onClick={loadOracleInfo}
                            variant="outline"
                            size="sm"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Info
                        </Button>
                    </div>

                    {/* Contract Owner */}
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200 flex items-center space-x-2">
                                <User className="h-4 w-4" />
                                <span>Contract Owner</span>
                            </h3>
                            {ownerData && (
                                <span className="rounded bg-purple-100 px-2 py-1 font-mono text-xs text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                                    {formatAddress(ownerData)}
                                </span>
                            )}
                        </div>
                        {ownerData ? (
                            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                                <AddressDisplayRow
                                    label="H160"
                                    value={ownerData}
                                    tone="purple"
                                />
                                {ownerNativeSs58Variants.map((address) => (
                                    <AddressDisplayRow
                                        key={address.label}
                                        label={address.label}
                                        value={address.value}
                                        tone={address.tone}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-md border border-purple-200 bg-white/70 p-3 text-sm text-gray-600 dark:border-purple-800 dark:bg-purple-950/30 dark:text-gray-300">
                                Loading owner address...
                            </div>
                        )}
                    </div>

                    {/* Validation Configuration */}
                    {configData && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3">
                                Validation Configuration
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400">Max Deviation</div>
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                        {safeBigIntToNumber(configData.maxDeviationBp) / 100}%
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        ({safeBigIntToNumber(configData.maxDeviationBp)} basis points)
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400">Staleness Threshold</div>
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                        {formatDuration(configData.stalenessThreshold)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        ({safeBigIntToNumber(configData.stalenessThreshold)} seconds)
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400">Min Update Interval</div>
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                        {formatDuration(configData.minUpdateInterval)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        ({safeBigIntToNumber(configData.minUpdateInterval)} seconds)
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {(validationConfigQuery.error || ownerQuery.error || lastUpdateQuery.error || staleQuery.error) && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-200">
                                {validationConfigQuery.error?.message || ownerQuery.error?.message || lastUpdateQuery.error?.message || staleQuery.error?.message}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Token-Specific Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Clock className="h-5 w-5" />
                        <span>Token Information</span>
                    </CardTitle>
                    <CardDescription>
                        View update history and staleness status for specific tokens
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Token Address Input */}
                    <div className="space-y-2">
                        <label htmlFor="infoTokenAddress" className="text-sm font-medium">
                            Token Address (optional)
                        </label>
                        <Input
                            id="infoTokenAddress"
                            placeholder="Enter token address or leave blank for dummy token"
                            value={tokenAddress}
                            onChange={(e) => setTokenAddress(e.target.value)}
                            className="font-mono text-sm"
                        />
                        <div className="text-xs text-gray-500">
                            💡 Leave blank to check the dummy token: {dummyTokenAddress.slice(0, 20)}...
                        </div>
                    </div>

                    <Button
                        onClick={loadOracleInfo}
                        className="w-full"
                    >
                        <Info className="h-4 w-4 mr-2" />
                        Get Token Info
                    </Button>

                    {/* Token Status */}
                    {(lastUpdateData !== null || staleData !== null) && (
                        <div className="space-y-3">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                                    Token Status: {tokenAddress.trim() || dummyTokenAddress.slice(0, 20) + '...'}
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">Last Update:</span>
                                        <span className="text-gray-900 dark:text-gray-100">
                                            {lastUpdateData ? formatTimestamp(Number(lastUpdateData)) : 'No data'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">Price Status:</span>
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-2 h-2 rounded-full ${staleData ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                            <span className={`text-sm font-medium ${staleData ? 'text-red-600' : 'text-green-600'}`}>
                                                {staleData ? 'Stale' : 'Fresh'}
                                            </span>
                                        </div>
                                    </div>
                                    {staleData && (
                                        <div className="flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
                                            <AlertCircle className="h-3 w-3" />
                                            <span>Price data is older than the staleness threshold</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
