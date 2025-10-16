// src/components/cards/network-status-card.tsx

'use client';

import { NetworkIndicator } from '@/components/network-indicator.dedot';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

export function NetworkStatusCard() {
    return (
        <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Network Status
            </h3>
            <div className="space-y-4">
                <NetworkIndicator 
                    chainId="passet_hub_testnet"
                    at="best"
                    showBlockNumber={true}
                    showLogo={true}
                />
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                        Connected to Passet Hub Testnet - Ready for contract interactions
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
}