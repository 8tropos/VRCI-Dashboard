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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className={`btn-outline text-left p-4 rounded-lg transition-all ${!signer ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                        }`}
                    disabled={!signer}
                >
                    <h3 className="font-semibold mb-1">Registry Contract</h3>
                    <p className="text-sm text-gray-600">
                        Manage portfolio tokens and configurations
                    </p>
                </button>
                <button
                    className="btn-outline text-left p-4 rounded-lg transition-all hover:scale-105"
                >
                    <h3 className="font-semibold mb-1">Market Analytics</h3>
                    <p className="text-sm text-gray-600">
                        View comprehensive market analytics and trends
                    </p>
                </button>
                <button
                    className={`btn-outline text-left p-4 rounded-lg transition-all ${!signer ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                        }`}
                    disabled={!signer}
                >
                    <h3 className="font-semibold mb-1">Portfolio Management</h3>
                    <p className="text-sm text-gray-600">
                        Track and manage your Web3 portfolio
                    </p>
                </button>
            </div>
        </div>
    );
}