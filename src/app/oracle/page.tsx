// src/app/oracle/page.tsx

'use client';

import { Suspense } from 'react';
import OraclePageContent from './_components/oracle-page-content';

export default function OraclePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading Oracle Interface...</p>
                        </div>
                    </div>
                </div>
            </div>
        }>
            <OraclePageContent />
        </Suspense>
    );
}