'use client';

import { useEffect, useState } from 'react';
import { useContract } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface ChartDataPoint {
  time: string;
  value: number;
  label: string;
}

type TimeRange = '24h' | '7d' | '30d' | 'all';

// Generate simulated historical data based on current value
function generateHistoricalData(
  currentValue: number,
  performanceBp: number,
  range: TimeRange
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const baseValue = 100;
  
  let points: number;
  let interval: number;
  let formatTime: (date: Date) => string;
  let formatLabel: (date: Date) => string;

  switch (range) {
    case '24h':
      points = 24;
      interval = 3600000; // 1 hour
      formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      formatLabel = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      break;
    case '7d':
      points = 7;
      interval = 86400000; // 1 day
      formatTime = (d) => d.toLocaleDateString([], { weekday: 'short' });
      formatLabel = (d) => d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      break;
    case '30d':
      points = 30;
      interval = 86400000;
      formatTime = (d) => d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      formatLabel = (d) => d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      break;
    case 'all':
      points = 12;
      interval = 2592000000; // ~30 days
      formatTime = (d) => d.toLocaleDateString([], { month: 'short', year: '2-digit' });
      formatLabel = (d) => d.toLocaleDateString([], { month: 'short', year: 'numeric' });
      break;
    default:
      points = 24;
      interval = 3600000;
      formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      formatLabel = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const now = Date.now();
  const totalChange = currentValue - baseValue;
  
  // Generate smooth curve from base to current
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    // Use easing function for more natural curve
    const easedProgress = progress * progress * (3 - 2 * progress);
    
    // Add some random variation
    const randomVariation = (Math.random() - 0.5) * 2 * Math.abs(totalChange * 0.1);
    
    const value = baseValue + (totalChange * easedProgress) + (i < points - 1 ? randomVariation : 0);
    const date = new Date(now - (points - 1 - i) * interval);
    
    data.push({
      time: formatTime(date),
      value: Math.max(0, Number(value.toFixed(2))),
      label: formatLabel(date),
    });
  }

  // Ensure last point is exactly current value
  if (data.length > 0) {
    data[data.length - 1].value = currentValue;
  }

  return data;
}

export function IndexPerformanceChart() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const [currentValue, setCurrentValue] = useState<number>(100);
  const [performanceBp, setPerformanceBp] = useState<number>(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!portfolioContract) {
        setIsLoading(false);
        return;
      }
      
      try {
        const summaryResult = await portfolioContract.query.getIndexSummary();
        if (summaryResult.data?.isOk) {
          const [currentVal, , perfBp] = summaryResult.data.value;
          const value = Number(currentVal) / 1e18;
          setCurrentValue(value);
          setPerformanceBp(Number(perfBp));
        }
      } catch (err) {
        // Use default values if query fails (e.g., AccountUnmapped)
        console.warn('Error fetching index data (may need account mapping):', err);
        setCurrentValue(100);
        setPerformanceBp(0);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [portfolioContract]);

  useEffect(() => {
    // Generate chart data when current value or time range changes
    const data = generateHistoricalData(currentValue, performanceBp, timeRange);
    setChartData(data);
  }, [currentValue, performanceBp, timeRange]);

  const isPositive = performanceBp >= 0;
  const minValue = Math.min(...chartData.map(d => d.value), 100) - 5;
  const maxValue = Math.max(...chartData.map(d => d.value), 100) + 5;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Index Performance
            </CardTitle>
            <CardDescription>
              Historical performance vs $100 base
            </CardDescription>
          </div>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList className="grid grid-cols-4 w-[240px]">
              <TabsTrigger value="24h">24H</TabsTrigger>
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  domain={[minValue, maxValue]}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const value = payload[0].value as number;
                      const diff = value - 100;
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                          <p className="text-sm text-gray-500">{payload[0].payload.label}</p>
                          <p className="text-lg font-bold">${value.toFixed(2)}</p>
                          <p className={`text-sm ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {diff >= 0 ? '+' : ''}{diff.toFixed(2)} ({((diff / 100) * 100).toFixed(2)}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine 
                  y={100} 
                  stroke="#9ca3af" 
                  strokeDasharray="5 5"
                  label={{ value: 'Base $100', position: 'right', fill: '#9ca3af', fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={isPositive ? '#10b981' : '#ef4444'}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: isPositive ? '#10b981' : '#ef4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
