// src/app/page.tsx

'use client';

import { WalletConnector } from '@/components/wallet-connector';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              W3PI - Web3 Portfolio Intelligence
            </h1>
            <p className="text-xl text-gray-600">
              Decentralized portfolio management built with ink! smart contracts
            </p>
          </div>
          <WalletConnector />
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Network Status
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">POP Testnet Connected</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Using RPC: wss://rpc2.paseo.popnetwork.xyz
            </p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Smart Contracts
            </h3>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Oracle Contract</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-700">Registry Contract</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Deploy contracts to activate features
            </p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Typink SDK
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Provider Initialized</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ready for contract interactions
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="btn-primary text-left p-4 rounded-lg">
              <h3 className="font-semibold mb-1">Connect Wallet</h3>
              <p className="text-sm opacity-90">
                Connect your Polkadot wallet to get started
              </p>
            </button>
            <button className="btn-outline text-left p-4 rounded-lg">
              <h3 className="font-semibold mb-1">View Portfolio</h3>
              <p className="text-sm text-gray-600">
                Check your token holdings and balances
              </p>
            </button>
            <button className="btn-outline text-left p-4 rounded-lg">
              <h3 className="font-semibold mb-1">Oracle Data</h3>
              <p className="text-sm text-gray-600">
                View live price feeds and market data
              </p>
            </button>
            <button className="btn-outline text-left p-4 rounded-lg">
              <h3 className="font-semibold mb-1">Manage Tokens</h3>
              <p className="text-sm text-gray-600">
                Add or update token configurations
              </p>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Built with <span className="text-primary font-semibold">ink!</span> smart contracts and{' '}
            <span className="text-secondary font-semibold">Typink</span> SDK
          </p>
        </div>
      </div>
    </div>
  );
}