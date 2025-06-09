// src/app/registry/page.tsx

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RegistryTokenViewer } from '@/components/registry/registry-token-viewer';
import { RegistryTokenManager } from '@/components/registry/registry-token-manager';
import { RegistryInfoViewer } from '@/components/registry/registry-info-viewer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTypink } from 'typink';
import { Search, Edit, Info, Shield, Clock, Package } from 'lucide-react';

const validTabs = ['query', 'manage', 'info'] as const;
type ValidTab = typeof validTabs[number];

function RegistryPageContent() {
    const { signer, connectedAccount } = useTypink();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get tab from URL, fallback to 'query'
    const urlTab = searchParams.get('tab');
    const isValidTab = (tab: string | null): tab is ValidTab => {
        return tab !== null && validTabs.includes(tab as ValidTab);
    };

    const [activeTab, setActiveTab] = useState<ValidTab>(
        isValidTab(urlTab) ? urlTab : 'query'
    );

    // Update URL when tab changes
    const updateUrl = (newTab: ValidTab) => {
        const currentParams = new URLSearchParams(searchParams.toString());
        if (newTab !== 'query') {
            currentParams.set('tab', newTab);
        } else {
            currentParams.delete('tab');
        }

        const newUrl = currentParams.toString()
            ? `/registry?${currentParams.toString()}`
            : '/registry';

        router.replace(newUrl, { scroll: false });
    };

    // Update active tab when URL changes (e.g., browser back/forward)
    useEffect(() => {
        const urlTab = searchParams.get('tab');
        if (isValidTab(urlTab) && urlTab !== activeTab) {
            setActiveTab(urlTab);
        } else if (!urlTab && activeTab !== 'query') {
            setActiveTab('query');
        }
    }, [searchParams, activeTab]);

    const handleTabChange = (value: string) => {
        if (isValidTab(value)) {
            setActiveTab(value);
            updateUrl(value);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
            <div className="max-w-6xl mx-auto p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
                        Registry Contract
                    </h1>
                    <p className="text-lg text-gray-600">
                        Portfolio token management and cross-contract integration
                    </p>
                </div>

                {/* Contract Status Banner */}
                <div className="card mb-8 bg-gradient-to-r p-4 rounded-2xl from-emerald-50 to-green-50 border-emerald-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                            <div>
                                <h3 className="text-lg font-semibold text-emerald-800">Registry Contract Active</h3>
                                <p className="text-sm text-emerald-600">Connected to POP Testnet • Portfolio management ready</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-emerald-700">
                            <div className="flex items-center space-x-1">
                                <Package className="h-4 w-4" />
                                <span>Token Registry</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Shield className="h-4 w-4" />
                                <span>Oracle Integration</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Registry Interface */}
                {signer && connectedAccount ? (
                    <div className="mb-8">
                        <Tabs value={activeTab} onValueChange={handleTabChange}>
                            {/* Tab Navigation */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-center mb-6">
                                <TabsList className="mt-4 sm:mt-0 grid grid-cols-3 w-full sm:w-auto">
                                    <TabsTrigger value="query" className="flex items-center space-x-1">
                                        <Search className="h-4 w-4" />
                                        <span>Query Tokens</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="manage" className="flex items-center space-x-1">
                                        <Edit className="h-4 w-4" />
                                        <span>Manage Tokens</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="info" className="flex items-center space-x-1">
                                        <Info className="h-4 w-4" />
                                        <span>Registry Info</span>
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            {/* Tab Content */}
                            <TabsContent value="query">
                                <RegistryTokenViewer />
                            </TabsContent>

                            <TabsContent value="manage">
                                <RegistryTokenManager />
                            </TabsContent>

                            <TabsContent value="info">
                                <RegistryInfoViewer />
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    <div className="mb-8">
                        <div className="card text-center py-8">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                                Connect Wallet to Continue
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Connect your wallet to interact with the registry contract
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Search className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-sm font-medium text-gray-700">Query Tokens</div>
                                    <div className="text-xs text-gray-500 mt-1">View registered tokens with live oracle data</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Edit className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-sm font-medium text-gray-700">Manage Tokens</div>
                                    <div className="text-xs text-gray-500 mt-1">Add new tokens and update portfolio data</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Info className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-sm font-medium text-gray-700">Registry Info</div>
                                    <div className="text-xs text-gray-500 mt-1">Contract details and statistics</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Function Categories Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="card bg-gradient-to-br p-4 rounded-2xl from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800">
                        <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-3 flex items-center space-x-2">
                            <Search className="h-5 w-5" />
                            <span>Query Functions</span>
                        </h3>
                        <div className="space-y-2 text-xs text-emerald-700 dark:text-emerald-300">
                            <div>• get_token_data(id) → Result&lt;EnrichedTokenData, Error&gt;</div>
                            <div>• get_basic_token_data(id) → Result&lt;TokenData, Error&gt;</div>
                            <div>• get_token_count() → u32</div>
                            <div>• token_exists(id) → bool</div>
                            <div>• get_owner() → AccountId</div>
                        </div>
                    </div>

                    <div className="card p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center space-x-2">
                            <Edit className="h-5 w-5" />
                            <span>Management Functions</span>
                        </h3>
                        <div className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
                            <div>• add_token(token, oracle) → Result&lt;u32, Error&gt;</div>
                            <div>• update_token(id, balance, weight, tier) → Result&lt;(), Error&gt;</div>
                        </div>
                    </div>

                    <div className="card p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                        <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center space-x-2">
                            <Package className="h-5 w-5" />
                            <span>Integration Features</span>
                        </h3>
                        <div className="space-y-2 text-xs text-purple-700 dark:text-purple-300">
                            <div>• Cross-contract oracle calls</div>
                            <div>• Live price data enrichment</div>
                            <div>• Portfolio balance tracking</div>
                            <div>• Investment tier management</div>
                        </div>
                    </div>
                </div>

                {/* Technical Documentation */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Technical Specifications
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2">Data Types</h4>
                            <div className="space-y-1 text-xs font-mono bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                <div>TokenData {'{'}token_contract: AccountId, oracle_contract: AccountId, balance: u128, weight_investment: u32, tier: u32{'}'}</div>
                                <div>EnrichedTokenData {'{'}...TokenData, market_cap: u128, market_volume: u128, price: u128{'}'}</div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2">Integration Details</h4>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Oracle Integration:</span>
                                    <span className="text-gray-900">Cross-contract calls</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Token ID Management:</span>
                                    <span className="text-gray-900">Auto-incrementing IDs</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Portfolio Tracking:</span>
                                    <span className="text-gray-900">Balance, weight, tier</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Framework:</span>
                                    <span className="text-gray-900">ink! v5.1.0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RegistryPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading registry interface...</p>
            </div>
        </div>}>
            <RegistryPageContent />
        </Suspense>
    );
}