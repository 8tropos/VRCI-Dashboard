// src/components/sections/quick-actions-section.tsx

'use client';

import { useTypink } from 'typink';
import { useRouter } from 'next/navigation';

export function QuickActionsSection() {
    const { signer } = useTypink();
    const router = useRouter();

    return (
        <div className="card">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                    onClick={() => router.push('/oracle')}
                    className={`btn-primary text-left p-4 rounded-lg transition-all ${!signer ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                        }`}
                    disabled={!signer}
                >
                    <h3 className="font-semibold mb-1">Oracle Contract</h3>
                    <p className="text-sm opacity-90">
                        Query and update price data feeds
                    </p>
                </button>
                <button
                    onClick={() => router.push('/registry')}
                    className={`btn-primary text-left p-4 rounded-lg transition-all ${!signer ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                        }`}
                    disabled={!signer}
                >
                    <h3 className="font-semibold mb-1">Registry Contract</h3>
                    <p className="text-sm opacity-90">
                        Manage portfolio tokens and configurations
                    </p>
                </button>
                <button
                    onClick={() => router.push('/token')}
                    className={`btn-primary text-left p-4 rounded-lg transition-all ${!signer ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                        }`}
                    disabled={!signer}
                >
                    <h3 className="font-semibold mb-1">Token Contract</h3>
                    <p className="text-sm opacity-90">
                        PSP22 token operations and management
                    </p>
                </button>
                <button
                    onClick={() => router.push('/portfolio')}
                    className={`btn-primary text-left p-4 rounded-lg transition-all ${!signer ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                        }`}
                    disabled={!signer}
                >
                    <h3 className="font-semibold mb-1">Portfolio Contract</h3>
                    <p className="text-sm opacity-90">
                        Investment portfolio management
                    </p>
                </button>
                <button
                    onClick={() => router.push('/staking')}
                    className={`btn-primary text-left p-4 rounded-lg transition-all ${!signer ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                        }`}
                    disabled={!signer}
                >
                    <h3 className="font-semibold mb-1">Staking Contract</h3>
                    <p className="text-sm opacity-90">
                        Token staking and rewards management
                    </p>
                </button>
                <button
                    onClick={() => router.push('/dex')}
                    className={`btn-primary text-left p-4 rounded-lg transition-all ${!signer ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                        }`}
                    disabled={!signer}
                >
                    <h3 className="font-semibold mb-1">DEX Contract</h3>
                    <p className="text-sm opacity-90">
                        Decentralized exchange operations
                    </p>
                </button>
            </div>
        </div>
    );
}