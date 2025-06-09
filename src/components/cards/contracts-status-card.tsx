// src/components/cards/contracts-status-card.tsx

'use client';

export function ContractsStatusCard() {
    return (
        <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Smart Contracts
            </h3>
            <div className="space-y-1">
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Oracle Contract</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Registry Contract</span>
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
                Both contracts deployed and ready
            </p>
        </div>
    );
}