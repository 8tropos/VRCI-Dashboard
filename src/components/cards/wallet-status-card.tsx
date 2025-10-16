// src/components/cards/wallet-status-card.tsx

'use client';

import { ConnectWallet } from '@/components/connect-wallet.dedot';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet } from 'lucide-react';

export function WalletStatusCard() {
    return (
        <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Wallet Status
            </h3>
            <div className="space-y-4">
                <ConnectWallet />
                <Alert>
                    <Wallet className="h-4 w-4" />
                    <AlertDescription>
                        Connect your wallet to interact with smart contracts and manage your portfolio
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
}