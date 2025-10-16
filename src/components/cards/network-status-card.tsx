// src/components/cards/network-status-card.tsx

'use client';

export function NetworkStatusCard() {
    return (
        <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Network Status
            </h3>
            <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Passet Hub Testnet Connected</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
                Using RPC: wss://passet-hub-paseo.ibp.network
            </p>
        </div>
    );
}