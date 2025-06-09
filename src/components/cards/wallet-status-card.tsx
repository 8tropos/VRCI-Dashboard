// src/components/cards/wallet-status-card.tsx

'use client';

import { useTypink } from 'typink';

export function WalletStatusCard() {
    const { signer, connectedAccount } = useTypink();

    return (
        <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Wallet Status
            </h3>
            <div className="space-y-1">
                <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${signer ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-gray-700">
                        {signer ? 'Wallet Connected' : 'Wallet Disconnected'}
                    </span>
                </div>
                {connectedAccount && (
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">
                            Account: {connectedAccount.name}
                        </span>
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
                {signer ? 'Ready for contract interactions' : 'Connect wallet to interact with contracts'}
            </p>
        </div>
    );
}