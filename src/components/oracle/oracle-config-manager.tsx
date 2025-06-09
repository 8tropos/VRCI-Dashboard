// src/components/oracle/oracle-config-manager.tsx

'use client';

import { useState } from 'react';
import { useContract, useContractTx } from 'typink';
import { ContractId } from '@/contracts/deployments';
import type { OracleContractApi } from '@/contracts/types/oracle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Shield, Clock, Percent, Save } from 'lucide-react';
import { txToaster } from '@/utils/txToaster';

export function OracleConfigManager() {
    const { contract: oracleContract } = useContract<OracleContractApi>(ContractId.ORACLE);
    const [maxDeviation, setMaxDeviation] = useState<string>('');
    const [stalenessThreshold, setStalenessThreshold] = useState<string>('');
    const [minUpdateInterval, setMinUpdateInterval] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const toaster = txToaster();

    const setMaxDeviationTx = useContractTx(oracleContract, 'setMaxDeviation');
    const setStalenessThresholdTx = useContractTx(oracleContract, 'setStalenessThreshold');
    const setMinUpdateIntervalTx = useContractTx(oracleContract, 'setMinUpdateInterval');

    const handleSetMaxDeviation = async () => {
        if (!oracleContract || !maxDeviation) {
            setError('Please enter a valid deviation percentage');
            return;
        }

        setError(null);
        try {
            const deviationBp = parseInt(maxDeviation) * 100; // Convert percentage to basis points
            await setMaxDeviationTx.signAndSend({
                args: [deviationBp],
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        setMaxDeviation('');
                    }
                }
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const handleSetStalenessThreshold = async () => {
        if (!oracleContract || !stalenessThreshold) {
            setError('Please enter a valid staleness threshold');
            return;
        }

        setError(null);
        try {
            const thresholdSeconds = BigInt(parseInt(stalenessThreshold));
            await setStalenessThresholdTx.signAndSend({
                args: [thresholdSeconds],
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        setStalenessThreshold('');
                    }
                }
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const handleSetMinUpdateInterval = async () => {
        if (!oracleContract || !minUpdateInterval) {
            setError('Please enter a valid update interval');
            return;
        }

        setError(null);
        try {
            const intervalSeconds = BigInt(parseInt(minUpdateInterval));
            await setMinUpdateIntervalTx.signAndSend({
                args: [intervalSeconds],
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        setMinUpdateInterval('');
                    }
                }
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const isLoading = setMaxDeviationTx.inBestBlockProgress ||
        setStalenessThresholdTx.inBestBlockProgress ||
        setMinUpdateIntervalTx.inBestBlockProgress;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Settings className="h-5 w-5" />
                        <span>Validation Configuration</span>
                    </CardTitle>
                    <CardDescription>
                        Configure oracle validation rules and limits (owner only)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Max Deviation */}
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 flex items-center space-x-2 mb-3">
                            <Percent className="h-4 w-4" />
                            <span>Maximum Price Deviation</span>
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <label htmlFor="maxDeviation" className="text-sm font-medium">
                                    Maximum Deviation (%)
                                </label>
                                <Input
                                    id="maxDeviation"
                                    type="number"
                                    step="0.1"
                                    placeholder="e.g., 20 (for 20%)"
                                    value={maxDeviation}
                                    onChange={(e) => setMaxDeviation(e.target.value)}
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-gray-500">
                                    Maximum allowed price change in percentage (e.g., 20 = 20% max change)
                                </p>
                            </div>
                            <Button
                                onClick={handleSetMaxDeviation}
                                disabled={!oracleContract || !maxDeviation || isLoading}
                                className="w-full"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Set Max Deviation
                            </Button>
                        </div>
                    </div>

                    {/* Staleness Threshold */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center space-x-2 mb-3">
                            <Clock className="h-4 w-4" />
                            <span>Staleness Threshold</span>
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <label htmlFor="stalenessThreshold" className="text-sm font-medium">
                                    Staleness Threshold (seconds)
                                </label>
                                <Input
                                    id="stalenessThreshold"
                                    type="number"
                                    placeholder="e.g., 3600 (1 hour)"
                                    value={stalenessThreshold}
                                    onChange={(e) => setStalenessThreshold(e.target.value)}
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-gray-500">
                                    Time after which price data is considered stale (3600 = 1 hour, 1800 = 30 minutes)
                                </p>
                            </div>
                            <Button
                                onClick={handleSetStalenessThreshold}
                                disabled={!oracleContract || !stalenessThreshold || isLoading}
                                className="w-full"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Set Staleness Threshold
                            </Button>
                        </div>
                    </div>

                    {/* Min Update Interval */}
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center space-x-2 mb-3">
                            <Shield className="h-4 w-4" />
                            <span>Minimum Update Interval</span>
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <label htmlFor="minUpdateInterval" className="text-sm font-medium">
                                    Minimum Update Interval (seconds)
                                </label>
                                <Input
                                    id="minUpdateInterval"
                                    type="number"
                                    placeholder="e.g., 60 (1 minute)"
                                    value={minUpdateInterval}
                                    onChange={(e) => setMinUpdateInterval(e.target.value)}
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-gray-500">
                                    Minimum time between updates to prevent spam (60 = 1 minute, 300 = 5 minutes)
                                </p>
                            </div>
                            <Button
                                onClick={handleSetMinUpdateInterval}
                                disabled={!oracleContract || !minUpdateInterval || isLoading}
                                className="w-full"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Set Update Interval
                            </Button>
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
        </div>
    );
}