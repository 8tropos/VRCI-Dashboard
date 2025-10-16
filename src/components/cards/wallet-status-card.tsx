// src/components/cards/wallet-status-card.tsx

'use client';

import { ConnectWallet } from '@/components/connect-wallet.dedot';

export function WalletStatusCard() {
    return (
        <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Wallet Status
            </h3>
            <ConnectWallet />
        </div>
    );
}