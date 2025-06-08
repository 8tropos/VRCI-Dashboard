// src/app/page.tsx

'use client';

import { useState } from 'react';
import { WalletConnector } from '@/components/wallet-connector';
import { OraclePriceFetcher } from '@/components/oracle-price-fetcher';
import { OraclePriceUpdater } from '@/components/oracle-price-updater';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTypink } from 'typink';
import { Search, Upload, BarChart3, Settings } from 'lucide-react';

export default function HomePage() {
  const { signer, connectedAccount } = useTypink();
  const [activeTab, setActiveTab] = useState('query');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
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
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-700">Registry Contract</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Oracle ready • Registry coming soon
            </p>
          </div>
        </div>

        {/* Oracle Contract Interface */}
        {signer && connectedAccount ? (
          <div className="mb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Tab Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    Oracle Contract Interface
                  </h2>
                  <p className="text-gray-600">
                    Query price data or update oracle feeds
                  </p>
                </div>
                <TabsList className="mt-4 sm:mt-0">
                  <TabsTrigger value="query" className="flex items-center space-x-2">
                    <Search className="h-4 w-4" />
                    <span>Query Data</span>
                  </TabsTrigger>
                  <TabsTrigger value="update" className="flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Update Data</span>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Content */}
              <TabsContent value="query">
                <OraclePriceFetcher />
              </TabsContent>

              <TabsContent value="update">
                <OraclePriceUpdater />
              </TabsContent>

              <TabsContent value="analytics">
                <div className="card text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Analytics Dashboard
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Price history, trends, and market analytics
                  </p>
                  <div className="text-sm text-gray-500">
                    Coming soon! Track price movements and market trends over time.
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="mb-8">
            <div className="card text-center py-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Oracle Contract Interface
              </h2>
              <p className="text-gray-600 mb-4">
                Connect your wallet to interact with the oracle contract
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-700">Query Functions</div>
                  <div className="text-xs text-gray-500 mt-1">
                    get_price, get_market_cap, get_market_volume
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-700">Update Functions</div>
                  <div className="text-xs text-gray-500 mt-1">
                    update_price, update_market_data (owner only)
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-700">Analytics</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Price trends and market insights
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab('query')}
              className={`btn-primary text-left p-4 rounded-lg transition-all ${!signer ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                }`}
              disabled={!signer}
            >
              <h3 className="font-semibold mb-1">Query Oracle Price</h3>
              <p className="text-sm opacity-90">
                Get live price data from the oracle contract
              </p>
            </button>
            <button
              onClick={() => setActiveTab('update')}
              className={`btn-outline text-left p-4 rounded-lg transition-all ${!signer ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                }`}
              disabled={!signer}
            >
              <h3 className="font-semibold mb-1">Update Oracle Data</h3>
              <p className="text-sm text-gray-600">
                Update price feeds and market data (owner only)
              </p>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
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
              <h3 className="font-semibold mb-1">Registry Management</h3>
              <p className="text-sm text-gray-600">
                Add or update token configurations (coming soon)
              </p>
            </button>
          </div>
        </div>

        {/* Contract Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Oracle Contract
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">Deployed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Network:</span>
                <span className="text-gray-900">Pop Testnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Functions:</span>
                <span className="text-gray-900">6 public methods</span>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="p-2 bg-blue-50 rounded text-xs">
                <span className="font-medium text-blue-800">Query:</span>
                <span className="text-blue-600"> get_price, get_market_cap, get_market_volume</span>
              </div>
              <div className="p-2 bg-green-50 rounded text-xs">
                <span className="font-medium text-green-800">Update:</span>
                <span className="text-green-600"> update_price, update_market_data (owner only)</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Registry Contract
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-yellow-600 font-medium">Coming Soon</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Purpose:</span>
                <span className="text-gray-900">Portfolio Management</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Features:</span>
                <span className="text-gray-900">Token tracking & balances</span>
              </div>
            </div>
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
              <span className="font-medium">Planned functions:</span> add_token, update_token, get_portfolio_data
            </div>
          </div>
        </div>

        {/* Developer Info */}
        <div className="mt-8 card">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Developer Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Oracle Contract Functions</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">get_price(token):</span>
                  <span className="font-mono text-blue-600">Option&lt;u128&gt;</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">get_market_cap(token):</span>
                  <span className="font-mono text-blue-600">Option&lt;u128&gt;</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">get_market_volume(token):</span>
                  <span className="font-mono text-blue-600">Option&lt;u128&gt;</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">update_price(token, price):</span>
                  <span className="font-mono text-green-600">Result&lt;(), Error&gt;</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">update_market_data(...):</span>
                  <span className="font-mono text-green-600">Result&lt;(), Error&gt;</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Technical Details</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Framework:</span>
                  <span className="text-gray-900">ink! v5.1.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frontend:</span>
                  <span className="text-gray-900">Next.js 15 + Typink</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type Generation:</span>
                  <span className="text-gray-900">Dedot CLI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Token Decimals:</span>
                  <span className="text-gray-900">10 (PAS)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage Format:</span>
                  <span className="text-gray-900">Plancks (1 PAS = 10^10 plancks)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Built with <span className="text-primary font-semibold">ink!</span> smart contracts and{' '}
            <span className="text-secondary font-semibold">Typink</span> SDK
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {signer ? (
              <>
                Connected as {connectedAccount?.name} •
                <span className="text-green-600"> Ready for transactions</span>
              </>
            ) : (
              'Connect your wallet to get started'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}