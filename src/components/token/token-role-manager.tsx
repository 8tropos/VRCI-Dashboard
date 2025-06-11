// src/components/token/token-role-manager.tsx

'use client';

import { useState } from 'react';
import { useContract, useContractTx } from 'typink';
import { ContractId } from '@/contracts/deployments';
import type { TokenContractApi } from '@/contracts/types/token';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, UserPlus, UserMinus, Crown, Plus, Minus, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface RoleState {
    type: 'idle' | 'pending' | 'success' | 'error';
    message?: string;
    operation?: string;
}

export function TokenRoleManager() {
    const { contract: tokenContract } = useContract<TokenContractApi>(ContractId.TOKEN);

    const [targetAccount, setTargetAccount] = useState<string>('');
    const [newOwner, setNewOwner] = useState<string>('');
    const [roleType, setRoleType] = useState<'minter' | 'burner'>('minter');
    const [operationType, setOperationType] = useState<'add' | 'remove' | 'transfer'>('add');
    const [roleState, setRoleState] = useState<RoleState>({ type: 'idle' });

    // Contract transactions
    const addMinterTx = useContractTx(tokenContract, 'addAuthorizedMinter');
    const removeMinterTx = useContractTx(tokenContract, 'removeAuthorizedMinter');
    const addBurnerTx = useContractTx(tokenContract, 'addAuthorizedBurner');
    const removeBurnerTx = useContractTx(tokenContract, 'removeAuthorizedBurner');
    const transferOwnershipTx = useContractTx(tokenContract, 'transferOwnership');

    const resetForm = () => {
        setTargetAccount('');
        setNewOwner('');
        setRoleState({ type: 'idle' });
    };

    const validateAddress = (address: string): boolean => {
        return address.trim().length > 0 && address.trim() !== '0'.repeat(48);
    };

    const handleAddRole = async () => {
        if (!tokenContract || !targetAccount.trim()) {
            setRoleState({
                type: 'error',
                message: 'Please enter a valid account address',
                operation: 'add'
            });
            return;
        }

        if (!validateAddress(targetAccount)) {
            setRoleState({
                type: 'error',
                message: 'Account address must be valid and non-zero',
                operation: 'add'
            });
            return;
        }

        setRoleState({
            type: 'pending',
            message: `Adding ${roleType} role to account...`,
            operation: 'add'
        });

        try {
            const tx = roleType === 'minter' ? addMinterTx : addBurnerTx;
            await tx.signAndSend({
                args: [targetAccount.trim()],
                callback: (progress) => {
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        if (progress.dispatchError) {
                            setRoleState({
                                type: 'error',
                                message: 'Transaction failed',
                                operation: 'add'
                            });
                        } else {
                            setRoleState({
                                type: 'success',
                                message: `Successfully added ${roleType} role`,
                                operation: 'add'
                            });
                            setTargetAccount('');
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Add role error:', err);
            setRoleState({
                type: 'error',
                message: `Failed to add role: ${err instanceof Error ? err.message : 'Unknown error'}`,
                operation: 'add'
            });
        }
    };

    const handleRemoveRole = async () => {
        if (!tokenContract || !targetAccount.trim()) {
            setRoleState({
                type: 'error',
                message: 'Please enter a valid account address',
                operation: 'remove'
            });
            return;
        }

        if (!validateAddress(targetAccount)) {
            setRoleState({
                type: 'error',
                message: 'Account address must be valid and non-zero',
                operation: 'remove'
            });
            return;
        }

        setRoleState({
            type: 'pending',
            message: `Removing ${roleType} role from account...`,
            operation: 'remove'
        });

        try {
            const tx = roleType === 'minter' ? removeMinterTx : removeBurnerTx;
            await tx.signAndSend({
                args: [targetAccount.trim()],
                callback: (progress) => {
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        if (progress.dispatchError) {
                            setRoleState({
                                type: 'error',
                                message: 'Transaction failed',
                                operation: 'remove'
                            });
                        } else {
                            setRoleState({
                                type: 'success',
                                message: `Successfully removed ${roleType} role`,
                                operation: 'remove'
                            });
                            setTargetAccount('');
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Remove role error:', err);
            setRoleState({
                type: 'error',
                message: `Failed to remove role: ${err instanceof Error ? err.message : 'Unknown error'}`,
                operation: 'remove'
            });
        }
    };

    const handleTransferOwnership = async () => {
        if (!tokenContract || !newOwner.trim()) {
            setRoleState({
                type: 'error',
                message: 'Please enter a valid new owner address',
                operation: 'transfer'
            });
            return;
        }

        if (!validateAddress(newOwner)) {
            setRoleState({
                type: 'error',
                message: 'New owner address must be valid and non-zero',
                operation: 'transfer'
            });
            return;
        }

        setRoleState({
            type: 'pending',
            message: 'Transferring ownership...',
            operation: 'transfer'
        });

        try {
            await transferOwnershipTx.signAndSend({
                args: [newOwner.trim()],
                callback: (progress) => {
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        if (progress.dispatchError) {
                            setRoleState({
                                type: 'error',
                                message: 'Ownership transfer failed',
                                operation: 'transfer'
                            });
                        } else {
                            setRoleState({
                                type: 'success',
                                message: 'Ownership transferred successfully',
                                operation: 'transfer'
                            });
                            setNewOwner('');
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Transfer ownership error:', err);
            setRoleState({
                type: 'error',
                message: `Ownership transfer failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
                operation: 'transfer'
            });
        }
    };

    const executeOperation = () => {
        switch (operationType) {
            case 'add':
                return handleAddRole();
            case 'remove':
                return handleRemoveRole();
            case 'transfer':
                return handleTransferOwnership();
        }
    };

    const isLoading = addMinterTx.inBestBlockProgress || removeMinterTx.inBestBlockProgress ||
        addBurnerTx.inBestBlockProgress || removeBurnerTx.inBestBlockProgress ||
        transferOwnershipTx.inBestBlockProgress;

    const getStateIcon = () => {
        switch (roleState.type) {
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

    return (
        <Card className="w-full shadow-none mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Role & Ownership Management</span>
                </CardTitle>
                <CardDescription>
                    Manage minting/burning permissions and contract ownership (owner only)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Operation Type Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Operation Type</label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { value: 'add', label: 'Add Role', icon: UserPlus, color: 'green' },
                            { value: 'remove', label: 'Remove Role', icon: UserMinus, color: 'red' },
                            { value: 'transfer', label: 'Transfer Ownership', icon: Crown, color: 'purple' }
                        ].map(({ value, label, icon: Icon, color }) => (
                            <label key={value} className={`flex items-center space-x-2 cursor-pointer p-3 rounded-lg border transition-all ${operationType === value
                                ? `border-${color}-300 bg-${color}-50 dark:bg-${color}-900/20`
                                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                                }`}>
                                <input
                                    type="radio"
                                    name="operationType"
                                    value={value}
                                    checked={operationType === value}
                                    onChange={(e) => {
                                        setOperationType(e.target.value as any);
                                        setRoleState({ type: 'idle' });
                                    }}
                                    className="text-primary focus:ring-primary"
                                    disabled={isLoading}
                                />
                                <Icon className="h-4 w-4" />
                                <span className="text-sm font-medium">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Role Type Selection (for add/remove operations) */}
                {(operationType === 'add' || operationType === 'remove') && (
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Role Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { value: 'minter', label: 'Minter', icon: Plus, description: 'Can mint new tokens' },
                                { value: 'burner', label: 'Burner', icon: Minus, description: 'Can burn tokens from accounts' }
                            ].map(({ value, label, icon: Icon, description }) => (
                                <label key={value} className={`flex items-start space-x-3 cursor-pointer p-3 rounded-lg border transition-all ${roleType === value
                                    ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'
                                    : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="roleType"
                                        value={value}
                                        checked={roleType === value}
                                        onChange={(e) => {
                                            setRoleType(e.target.value as any);
                                            setRoleState({ type: 'idle' });
                                        }}
                                        className="text-primary focus:ring-primary mt-1"
                                        disabled={isLoading}
                                    />
                                    <Icon className="h-4 w-4 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-medium">{label}</div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">{description}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Status Message */}
                {roleState.type !== 'idle' && (
                    <div className={`p-4 rounded-lg border flex items-start space-x-3 ${roleState.type === 'pending'
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                        : roleState.type === 'success'
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        }`}>
                        {getStateIcon()}
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${roleState.type === 'pending'
                                ? 'text-blue-800 dark:text-blue-200'
                                : roleState.type === 'success'
                                    ? 'text-green-800 dark:text-green-200'
                                    : 'text-red-800 dark:text-red-200'
                                }`}>
                                {roleState.message}
                            </p>
                        </div>
                    </div>
                )}

                {/* Input Fields */}
                <div className="space-y-4">
                    {operationType === 'transfer' ? (
                        <div className="space-y-2">
                            <label htmlFor="newOwner" className="text-sm font-medium">
                                New Owner Address *
                            </label>
                            <Input
                                id="newOwner"
                                placeholder="Enter new owner address"
                                value={newOwner}
                                onChange={(e) => setNewOwner(e.target.value)}
                                className="font-mono text-sm"
                                disabled={isLoading}
                            />
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                ⚠️ This will permanently transfer contract ownership
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label htmlFor="targetAccount" className="text-sm font-medium">
                                Target Account Address *
                            </label>
                            <Input
                                id="targetAccount"
                                placeholder="Enter account address"
                                value={targetAccount}
                                onChange={(e) => setTargetAccount(e.target.value)}
                                className="font-mono text-sm"
                                disabled={isLoading}
                            />
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Account that will {operationType === 'add' ? 'receive' : 'lose'} the {roleType} role
                            </p>
                        </div>
                    )}

                    {/* Action Button */}
                    <Button
                        onClick={executeOperation}
                        disabled={
                            !tokenContract ||
                            (operationType === 'transfer' ? !newOwner.trim() : !targetAccount.trim()) ||
                            isLoading
                        }
                        className="w-full"
                        variant={operationType === 'remove' ? 'destructive' : operationType === 'transfer' ? 'destructive' : 'default'}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : operationType === 'add' ? (
                            <UserPlus className="h-4 w-4 mr-2" />
                        ) : operationType === 'remove' ? (
                            <UserMinus className="h-4 w-4 mr-2" />
                        ) : (
                            <Crown className="h-4 w-4 mr-2" />
                        )}
                        {isLoading
                            ? `${operationType === 'add' ? 'Adding' : operationType === 'remove' ? 'Removing' : 'Transferring'}...`
                            : operationType === 'add'
                                ? `Add ${roleType} Role`
                                : operationType === 'remove'
                                    ? `Remove ${roleType} Role`
                                    : 'Transfer Ownership'
                        }
                    </Button>
                </div>

                {/* Clear Form Button */}
                {(targetAccount || newOwner) && (
                    <div className="flex justify-center">
                        <Button
                            onClick={resetForm}
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                        >
                            Clear Form
                        </Button>
                    </div>
                )}

                {/* Role Definitions */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-3 flex items-center space-x-2">
                        <Crown className="h-4 w-4" />
                        <span>Token Role Definitions</span>
                    </h4>
                    <div className="space-y-2 text-xs text-amber-700 dark:text-amber-300">
                        <div><strong>Owner:</strong> Full contract control, can manage all roles and transfer ownership</div>
                        <div><strong>Authorized Minter:</strong> Can mint new tokens to any account (mint_to function)</div>
                        <div><strong>Authorized Burner:</strong> Can burn tokens from any account (burn_from function)</div>
                        <div className="pt-2 border-t border-amber-200 dark:border-amber-700">
                            <strong>Important:</strong> Only the contract owner can add/remove roles and transfer ownership. Unauthorized operations will fail.
                        </div>
                    </div>
                </div>

                {/* Contract Status */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Token Contract:</span>
                            <span className={`flex items-center space-x-2 ${tokenContract ? 'text-green-600' : 'text-red-600'}`}>
                                <div className={`w-2 h-2 rounded-full ${tokenContract ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span>{tokenContract ? 'Connected' : 'Not Available'}</span>
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Transaction Status:</span>
                            <span className={`flex items-center space-x-2 ${isLoading ? 'text-blue-600' : 'text-gray-500'}`}>
                                {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                                <span>{isLoading ? 'Processing...' : 'Ready'}</span>
                            </span>
                        </div>
                    </div>

                    {!tokenContract && (
                        <div className="flex items-center space-x-2 text-xs text-amber-600 mt-3">
                            <AlertCircle className="h-3 w-3" />
                            <span>Make sure your wallet is connected and token contract is deployed</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}