// src/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PolkadotProvider } from '@/lib/polkadot-provider.dedot';
import { ContractNav } from '@/components/navigation/contract-nav';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'W3PI - Web3 Portfolio Intelligence',
  description: 'A decentralized portfolio management platform built with ink! smart contracts',
  keywords: ['Web3', 'DeFi', 'Portfolio', 'Polkadot', 'ink!', 'Smart Contracts'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800`}>
        <Providers>
          <PolkadotProvider>
            <div className="min-h-screen flex flex-col">
              <ContractNav />
              <main className="flex-1">
                {children}
              </main>
            </div>
            {/* <ToastContainer
              position="bottom-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            /> */}
          </PolkadotProvider>
        </Providers>
      </body>
    </html>
  );
}