'use client';

import { useEffect, useState } from 'react';
import { useContract, useTypink } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import type { RegistryContractApi } from '@/lib/contracts/registry';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface TokenHolding {
  tokenId: number;
  symbol: string;
  weight: number;
  amount: bigint;
  color: string;
}

// Color palette for pie chart
const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
];

// Token symbol mapping (fallback for demo)
const TOKEN_SYMBOLS: Record<number, string> = {
  1: 'DOT',
  2: 'USDC',
  3: 'ASTR',
  4: 'GLMR',
  5: 'ACA',
  6: 'PHA',
  7: 'PARA',
  8: 'INTR',
};

export function PortfolioCompositionChart() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const { contract: registryContract } = useContract<RegistryContractApi>('registry');
  const [holdings, setHoldings] = useState<TokenHolding[]>([]);
  const [totalTokens, setTotalTokens] = useState<number>(0);
  const [totalValue, setTotalValue] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {
    async function fetchData() {
      if (!portfolioContract) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch portfolio composition
        const compositionResult = await portfolioContract.query.getPortfolioComposition();

        if (compositionResult.data) {
          const composition = compositionResult.data;
          setTotalTokens(composition.totalTokens);
          setTotalValue(composition.totalValue);

          // Process holdings
          const processedHoldings: TokenHolding[] = composition.holdings.map(
            ([tokenId, holding], index) => ({
              tokenId,
              symbol: TOKEN_SYMBOLS[tokenId] || `Token ${tokenId}`,
              weight: holding.targetWeightBp / 100, // Convert basis points to percentage
              amount: holding.amount,
              color: COLORS[index % COLORS.length],
            })
          );

          setHoldings(processedHoldings);
        }
      } catch (err) {
        // Set demo data if contract call fails (e.g., AccountUnmapped)
        console.warn('Error fetching portfolio composition (may need account mapping):', err);
        setDemoData();
      } finally {
        setIsLoading(false);
      }
    }

    function setDemoData() {
      const demoHoldings: TokenHolding[] = [
        { tokenId: 1, symbol: 'DOT', weight: 25, amount: 1000n * 10n ** 18n, color: COLORS[0] },
        { tokenId: 2, symbol: 'ASTR', weight: 20, amount: 5000n * 10n ** 18n, color: COLORS[1] },
        { tokenId: 3, symbol: 'GLMR', weight: 15, amount: 2000n * 10n ** 18n, color: COLORS[2] },
        { tokenId: 4, symbol: 'ACA', weight: 15, amount: 3000n * 10n ** 18n, color: COLORS[3] },
        { tokenId: 5, symbol: 'PHA', weight: 10, amount: 8000n * 10n ** 18n, color: COLORS[4] },
        { tokenId: 6, symbol: 'INTR', weight: 10, amount: 4000n * 10n ** 18n, color: COLORS[5] },
        { tokenId: 7, symbol: 'PARA', weight: 5, amount: 10000n * 10n ** 18n, color: COLORS[6] },
      ];
      setHoldings(demoHoldings);
      setTotalTokens(7);
      setTotalValue(100n * 10n ** 18n);
    }

    fetchData();
  }, [portfolioContract, registryContract]);

  // Prepare data for pie chart
  const chartData = holdings.map((h) => ({
    name: h.symbol,
    value: h.weight,
    color: h.color,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-gray-600">{data.value.toFixed(1)}% allocation</p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = () => {
    return (
      <div className="grid grid-cols-2 gap-2 mt-4">
        {holdings.map((holding) => (
          <div key={holding.tokenId} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: holding.color }}
            />
            <span className="text-sm">
              {holding.symbol}: {holding.weight.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-indigo-600" />
          Portfolio Composition
        </CardTitle>
        <CardDescription>
          {totalTokens} tokens • Target weight allocation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : holdings.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No tokens in portfolio
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="h-[250px] w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2">
              {renderLegend()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
