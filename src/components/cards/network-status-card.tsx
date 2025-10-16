// src/components/cards/network-status-card.tsx

'use client';

import { NetworkIndicator } from '@/components/network-indicator.dedot';

export function NetworkStatusCard() {
    return (
        <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Network Status
            </h3>
            <NetworkIndicator />
        </div>
    );
}