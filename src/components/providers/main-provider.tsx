// src/components/providers/main-provider.tsx

'use client';

import { ReactNode } from 'react';
import { TypinkProvider } from 'typink';
import { AppProvider } from './app-provider';
import { deployments, rpcUrl } from '@/contracts/deployments';

const DEFAULT_CALLER = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice

const customPopTestnet = {
    decimals: 10,
    faucetUrl: 'https://onboard.popnetwork.xyz',
    id: 'pop_testnet',
    logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/networks/pop-network.svg',
    name: 'POP Testnet',
    pjsUrl: 'https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc2.paseo.popnetwork.xyz',
    providers: [rpcUrl],
    rpcUrl: `${rpcUrl}/`,
    symbol: 'PAS',
}
const SUPPORTED_NETWORKS = [customPopTestnet];

interface Props {
    children: ReactNode;
}

export function MainProvider({ children }: Props) {
    console.log('Trying to initialize TypinkProvider...');
    console.log('Supported Networks:', SUPPORTED_NETWORKS);
    console.log('Default Network ID:', customPopTestnet.id);
    console.log('Deployments:', deployments);

    return (
        <TypinkProvider
            appName="W3PI - Web3 Portfolio Intelligence"
            deployments={deployments}
            defaultCaller={DEFAULT_CALLER}
            defaultNetworkId={customPopTestnet.id}
            supportedNetworks={SUPPORTED_NETWORKS}
        >
            <AppProvider>
                {children}
            </AppProvider>
        </TypinkProvider>
    );
}