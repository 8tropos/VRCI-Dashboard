// src/components/oracle/oracle-authorization-manager.tsx

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useContract, useContractTx, useTypink } from 'typink';
import type { ContractTxOptions } from 'dedot/contracts';
import type { OracleContractApi } from '@/lib/contracts/oracle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, UserMinus, Users, Shield, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { txToaster } from '@/utils/txToaster';
import { LabelWithHelp } from '@/components/ui/field-help';
import { Badge } from '@/components/ui/badge';

type ConnectedAuthorizationStatus = 'idle' | 'loading' | 'allowed' | 'denied' | 'error';

const ORACLE_AUTH_TX_OPTIONS: Partial<ContractTxOptions> = {
    gasLimit: {
        refTime: 100_000_000_000n,
        proofSize: 1_000_000n,
    },
};

export function OracleAuthorizationManager() {
    const { contract: oracleContract } = useContract<OracleContractApi>('oracle');
    const { connectedAccount } = useTypink();
    const [updaterAddress, setUpdaterAddress] = useState<string>('');
    const [removeAddress, setRemoveAddress] = useState<string>('');
    const [checkAddress, setCheckAddress] = useState<string>('');
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [connectedAuthorizationStatus, setConnectedAuthorizationStatus] = useState<ConnectedAuthorizationStatus>('idle');
    const [connectedAuthorizationError, setConnectedAuthorizationError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const addUpdaterTx = useContractTx(oracleContract, 'addUpdater');
    const removeUpdaterTx = useContractTx(oracleContract, 'removeUpdater');
    const connectedAddress = connectedAccount?.address ?? '';

    const refreshConnectedAuthorization = useCallback(async () => {
        if (!connectedAddress) {
            setConnectedAuthorizationStatus('idle');
            setConnectedAuthorizationError(null);
            return;
        }

        if (!oracleContract) {
            setConnectedAuthorizationStatus('idle');
            setConnectedAuthorizationError('Oracle contract is not available');
            return;
        }

        setConnectedAuthorizationStatus('loading');
        setConnectedAuthorizationError(null);

        try {
            const result = await oracleContract.query.isAuthorizedUpdater(connectedAddress);
            setConnectedAuthorizationStatus(result.data === true ? 'allowed' : 'denied');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setConnectedAuthorizationStatus('error');
            setConnectedAuthorizationError(errorMessage);
        }
    }, [connectedAddress, oracleContract]);

    useEffect(() => {
        void refreshConnectedAuthorization();
    }, [refreshConnectedAuthorization]);

    const handleAddUpdater = async () => {
        if (!oracleContract || !updaterAddress.trim()) {
            setError('Please enter a valid updater address');
            return;
        }

        setError(null);
        
        // Create toaster only when transaction starts
        const toaster = txToaster('Signing transaction to add updater...');
        
        try {
            await addUpdaterTx.signAndSend({
                args: [updaterAddress.trim()],
                txOptions: ORACLE_AUTH_TX_OPTIONS,
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        setUpdaterAddress('');
                        void refreshConnectedAuthorization();
                    }
                }
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const handleRemoveUpdater = async () => {
        if (!oracleContract || !removeAddress.trim()) {
            setError('Please enter a valid address to remove');
            return;
        }

        setError(null);
        
        // Create toaster only when transaction starts
        const toaster = txToaster('Signing transaction to remove updater...');
        
        try {
            await removeUpdaterTx.signAndSend({
                args: [removeAddress.trim()],
                txOptions: ORACLE_AUTH_TX_OPTIONS,
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        setRemoveAddress('');
                        void refreshConnectedAuthorization();
                    }
                }
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const handleCheckAuthorization = async () => {
        if (!oracleContract || !checkAddress.trim()) {
            setError('Please enter a valid address to check');
            return;
        }

        setError(null);
        setIsAuthorized(null);
        try {
            const result = await oracleContract.query.isAuthorizedUpdater(checkAddress.trim());
            setIsAuthorized(result.data || false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
        }
    };

    const isLoading = addUpdaterTx.inBestBlockProgress || removeUpdaterTx.inBestBlockProgress;
    const connectedAuthorizationIsLoading = connectedAuthorizationStatus === 'loading';
    const connectedAuthorizationCanUpdate = connectedAuthorizationStatus === 'allowed';

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span>Authorization Management</span>
                    </CardTitle>
                    <CardDescription>
                        Manage authorized price updaters (owner only)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Connected Wallet Status */}
                    <div className={`p-4 rounded-lg border ${connectedAuthorizationCanUpdate
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                        : 'bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:border-slate-700'
                        }`}>
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                                    <Shield className="h-4 w-4" />
                                    <span>Connected Wallet Update Permission</span>
                                </h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                    Owner accounts are also allowed by the contract.
                                </p>
                            </div>
                            <Button
                                type="button"
                                onClick={refreshConnectedAuthorization}
                                disabled={!connectedAddress || !oracleContract || connectedAuthorizationIsLoading}
                                variant="outline"
                                size="sm"
                                className="shrink-0"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${connectedAuthorizationIsLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>

                        {connectedAddress ? (
                            <div className="space-y-3">
                                <div className="break-all rounded bg-white/70 p-2 font-mono text-xs text-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
                                    {connectedAddress}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {connectedAuthorizationStatus === 'loading' && (
                                        <Badge variant="secondary" className="gap-1">
                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                            Checking permission
                                        </Badge>
                                    )}
                                    {connectedAuthorizationStatus === 'allowed' && (
                                        <Badge className="gap-1 bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-200">
                                            <CheckCircle className="h-3 w-3" />
                                            Can update prices
                                        </Badge>
                                    )}
                                    {connectedAuthorizationStatus === 'denied' && (
                                        <Badge variant="secondary" className="gap-1">
                                            <XCircle className="h-3 w-3" />
                                            Cannot update prices
                                        </Badge>
                                    )}
                                    {connectedAuthorizationStatus === 'error' && (
                                        <Badge variant="destructive" className="gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Permission check failed
                                        </Badge>
                                    )}
                                </div>
                                {connectedAuthorizationError && (
                                    <p className="text-sm text-red-700 dark:text-red-300">
                                        {connectedAuthorizationError}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Connect a wallet to check update permission.
                            </p>
                        )}
                    </div>

                    {/* Add Updater */}
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center space-x-2 mb-3">
                            <UserPlus className="h-4 w-4" />
                            <span>Add Authorized Updater</span>
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="updaterAddress"
                                    helpText="The account address (SS58 format) that will be granted permission to update oracle prices. Authorized updaters can update token prices, market cap, and volume data without needing owner permissions. For production, you should have multiple authorized updaters to ensure price feeds remain updated. Only the contract owner can add or remove updaters."
                                >
                                    Updater Address
                                </LabelWithHelp>
                                <Input
                                    id="updaterAddress"
                                    placeholder="Enter account address (e.g., 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY)"
                                    value={updaterAddress}
                                    onChange={(e) => setUpdaterAddress(e.target.value)}
                                    className="font-mono text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                            <Button
                                onClick={handleAddUpdater}
                                disabled={!oracleContract || !updaterAddress.trim() || isLoading}
                                className="w-full"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Updater
                            </Button>
                        </div>
                    </div>

                    {/* Remove Updater */}
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 flex items-center space-x-2 mb-3">
                            <UserMinus className="h-4 w-4" />
                            <span>Remove Authorized Updater</span>
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="removeAddress"
                                    helpText="The account address (SS58 format) that will have its update permissions revoked. Once removed, this address will no longer be able to update oracle prices. Only the contract owner can remove updaters. Make sure you have other updaters configured before removing one to avoid service disruption."
                                >
                                    Address to Remove
                                </LabelWithHelp>
                                <Input
                                    id="removeAddress"
                                    placeholder="Enter account address to remove"
                                    value={removeAddress}
                                    onChange={(e) => setRemoveAddress(e.target.value)}
                                    className="font-mono text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                            <Button
                                onClick={handleRemoveUpdater}
                                disabled={!oracleContract || !removeAddress.trim() || isLoading}
                                variant="destructive"
                                className="w-full"
                            >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remove Updater
                            </Button>
                        </div>
                    </div>

                    {/* Check Authorization */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center space-x-2 mb-3">
                            <Shield className="h-4 w-4" />
                            <span>Check Authorization Status</span>
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="checkAddress"
                                    helpText="Enter an account address (SS58 format) to check if it has authorization to update oracle prices. This is a read-only query that doesn't require a transaction. The result will show whether the address is currently authorized as an updater."
                                >
                                    Address to Check
                                </LabelWithHelp>
                                <Input
                                    id="checkAddress"
                                    placeholder="Enter account address to check"
                                    value={checkAddress}
                                    onChange={(e) => setCheckAddress(e.target.value)}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <Button
                                onClick={handleCheckAuthorization}
                                disabled={!oracleContract || !checkAddress.trim()}
                                variant="outline"
                                className="w-full"
                            >
                                <Shield className="h-4 w-4 mr-2" />
                                Check Authorization
                            </Button>

                            {/* Authorization Result */}
                            {isAuthorized !== null && (
                                <div className={`p-3 rounded-lg border ${isAuthorized
                                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                    }`}>
                                    <div className="flex items-center space-x-2">
                                        <CheckCircle className={`h-4 w-4 ${isAuthorized ? 'text-green-600' : 'text-gray-500'}`} />
                                        <span className={`text-sm font-medium ${isAuthorized
                                            ? 'text-green-800 dark:text-green-200'
                                            : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                            {isAuthorized
                                                ? 'Address is authorized to update prices'
                                                : 'Address is not authorized to update prices'
                                            }
                                        </span>
                                    </div>
                                </div>
                            )}
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
