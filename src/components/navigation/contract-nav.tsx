// src/components/navigation/contract-nav.tsx

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ConnectWallet } from '@/components/connect-wallet.dedot';
import { TrendingUp, Package, Home, BarChart3, Coins } from 'lucide-react';

export function ContractNav() {
    const router = useRouter();
    const pathname = usePathname();

    const navItems = [
        {
            name: 'Dashboard',
            href: '/',
            icon: Home,
            description: 'Main dashboard'
        },
        {
            name: 'Oracle',
            href: '/oracle',
            icon: TrendingUp,
            description: 'Price feeds & market data'
        },
        {
            name: 'Registry',
            href: '/registry',
            icon: Package,
            description: 'Token portfolio management'
        },
        {
            name: 'Token',
            href: '/token',
            icon: Coins,
            description: 'PSP22 token operations'
        },
        {
            name: 'Analytics',
            href: '/analytics',
            icon: BarChart3,
            description: 'Market analytics & insights'
        }
    ];

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(href);
    };

    return (
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center space-x-8">
                        <div
                            className="flex items-center space-x-2 cursor-pointer"
                            onClick={() => router.push('/')}
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">W3</span>
                            </div>
                            <span className="font-bold text-xl text-gray-900 dark:text-gray-100">
                                W3PI
                            </span>
                        </div>

                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center space-x-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);

                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => router.push(item.href)}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        title={item.description}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{item.name}</span>
                                        {active && (
                                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right side - Wallet Connector */}
                    <div className="flex items-center">
                        <ConnectWallet />
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden pb-4">
                    <div className="flex items-center space-x-1 overflow-x-auto">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);

                            return (
                                <button
                                    key={item.name}
                                    onClick={() => router.push(item.href)}
                                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${active
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Icon className="h-3 w-3" />
                                    <span>{item.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
}