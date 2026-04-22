'use client';

import { useEffect, useState, useMemo } from 'react';
import { useContract, useContractQuery } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import type { OracleContractApi } from '@/lib/contracts/oracle';
import type { RegistryContractApi } from '@/lib/contracts/registry';
import type { StakingContractApi } from '@/lib/contracts/staking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Layers,
  DollarSign,
  Wallet,
  Lock,
  Activity,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PIE_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

const TIER_COLORS: Record<string, string> = {
  Tier1: '#3b82f6',
  Tier2: '#22c55e',
  Tier3: '#a855f7',
  Tier4: '#f59e0b',
};

interface StatCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  trend?: { value: string; up: boolean };
}

function StatCard({ title, value, sub, icon: Icon, color, bg, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
            {trend && (
              <p className={cn('text-xs font-medium flex items-center gap-1', trend.up ? 'text-green-600' : 'text-red-600')}>
                {trend.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trend.value}
              </p>
            )}
          </div>
          <div className={cn('p-2 rounded-lg', bg)}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, description, onRefresh }: { title: string; description: string; onRefresh?: () => void }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      {onRefresh && (
        <Button variant="outline" size="sm" onClick={onRefresh} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const { contract: oracleContract } = useContract<OracleContractApi>('oracle');
  const { contract: registryContract } = useContract<RegistryContractApi>('registry');
  const { contract: stakingContract } = useContract<StakingContractApi>('staking');

  // ── Portfolio data ──────────────────────────────────────────────
  const indexSummaryQuery = useContractQuery({ contract: portfolioContract, fn: 'getIndexSummary' });
  const portfolioStatsQuery = useContractQuery({ contract: portfolioContract, fn: 'getPortfolioStats' });
  const compositionQuery = useContractQuery({ contract: portfolioContract, fn: 'getPortfolioComposition' });
  const feeConfigQuery = useContractQuery({ contract: portfolioContract, fn: 'getFeeConfig' });
  const feesCollectedQuery = useContractQuery({ contract: portfolioContract, fn: 'getTotalFeesCollected' });
  const stateQuery = useContractQuery({ contract: portfolioContract, fn: 'getState' });
  const indexPerfQuery = useContractQuery({ contract: portfolioContract, fn: 'getIndexPerformance' });

  // ── Oracle data ─────────────────────────────────────────────────
  const dotPriceQuery = useContractQuery({ contract: oracleContract, fn: 'getDotUsdPrice' });

  // ── Registry data ───────────────────────────────────────────────
  const tierDistQuery = useContractQuery({ contract: registryContract, fn: 'getTierDistribution' });
  const tokenCountQuery = useContractQuery({ contract: registryContract, fn: 'getTokenCount' });
  const activeTierQuery = useContractQuery({ contract: registryContract, fn: 'getActiveTier' });

  // ── Staking data ────────────────────────────────────────────────
  const totalStakedQuery = useContractQuery({ contract: stakingContract, fn: 'getTotalStaked' });
  const rewardsPoolQuery = useContractQuery({ contract: stakingContract, fn: 'getRewardsPoolBalance' });
  const totalDistributedQuery = useContractQuery({ contract: stakingContract, fn: 'getTotalRewardsDistributed' });

  const refreshAll = () => {
    indexSummaryQuery.refresh();
    portfolioStatsQuery.refresh();
    compositionQuery.refresh();
    feeConfigQuery.refresh();
    feesCollectedQuery.refresh();
    stateQuery.refresh();
    indexPerfQuery.refresh();
    dotPriceQuery.refresh();
    tierDistQuery.refresh();
    tokenCountQuery.refresh();
    activeTierQuery.refresh();
    totalStakedQuery.refresh();
    rewardsPoolQuery.refresh();
    totalDistributedQuery.refresh();
  };

  // ── Derived values ──────────────────────────────────────────────
  const indexSummary = indexSummaryQuery.data;
  const currentValue = indexSummary?.isOk ? Number(indexSummary.value[0]) / 1e18 : null;
  const baseValue = indexSummary?.isOk ? Number(indexSummary.value[1]) / 1e18 : null;
  const perfBp = indexSummary?.isOk ? indexSummary.value[2] : null;
  const lastUpdate = indexSummary?.isOk ? indexSummary.value[3] : null;

  const isPositive = perfBp !== null && perfBp >= 0;
  const perfPct = perfBp !== null ? (perfBp / 100).toFixed(2) : null;

  const dotPrice = dotPriceQuery.data ? Number(dotPriceQuery.data) / 1e9 : null;

  const feeConfig = feeConfigQuery.data;
  const feesCollected = feesCollectedQuery.data ? Number(feesCollectedQuery.data) / 1e18 : 0;

  const totalStaked = totalStakedQuery.data ? Number(totalStakedQuery.data) / 1e18 : 0;
  const rewardsPool = rewardsPoolQuery.data ? Number(rewardsPoolQuery.data) / 1e18 : 0;
  const totalDistributed = totalDistributedQuery.data ? Number(totalDistributedQuery.data) / 1e18 : 0;

  const tokenCount = tokenCountQuery.data ?? 0;
  const activeTier = activeTierQuery.data ?? 'Tier2';

  // Tier distribution chart data
  const tierDist = useMemo(() => {
    if (!tierDistQuery.data) return [];
    return tierDistQuery.data.map(([tier, count]) => ({
      name: String(tier).replace('Tier', 'Tier '),
      count: Number(count),
      fill: TIER_COLORS[String(tier)] ?? '#6366f1',
    }));
  }, [tierDistQuery.data]);

  // Portfolio composition chart data
  const compositionData = useMemo(() => {
    if (!compositionQuery.data?.holdings?.length) return [];
    return compositionQuery.data.holdings.slice(0, 12).map(([tokenId, holding], idx) => ({
      name: `Token ${tokenId}`,
      value: holding.targetWeightBp / 100,
      fill: PIE_COLORS[idx % PIE_COLORS.length],
    }));
  }, [compositionQuery.data]);

  // Simulated performance history (based on current performance %)
  const perfHistory = useMemo(() => {
    const end = currentValue ?? 100;
    const points = 7;
    return Array.from({ length: points }, (_, i) => {
      const progress = i / (points - 1);
      const ease = progress * progress * (3 - 2 * progress);
      return {
        day: `Day ${i + 1}`,
        value: Number((100 + (end - 100) * ease).toFixed(2)),
      };
    });
  }, [currentValue]);

  // Fee breakdown bars
  const feeData = feeConfig
    ? [
        { name: 'Buy Fee', bps: feeConfig.buyFeeBp, pct: (feeConfig.buyFeeBp / 100).toFixed(2) },
        { name: 'Sell Fee', bps: feeConfig.sellFeeBp, pct: (feeConfig.sellFeeBp / 100).toFixed(2) },
        { name: 'Streaming', bps: feeConfig.streamingFeeBp, pct: (feeConfig.streamingFeeBp / 100).toFixed(2) },
      ]
    : [];

  const formatDate = (ts: bigint) => new Date(Number(ts)).toLocaleString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="mx-auto max-w-7xl p-6 lg:p-8 space-y-8">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-indigo-600" />
              Analytics
            </h1>
            <p className="text-gray-500 mt-1">Live on-chain metrics across all W3PI contracts</p>
          </div>
          <Button onClick={refreshAll} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh All
          </Button>
        </div>

        {/* ── KPI Row ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="W3PI Index Value"
            value={currentValue !== null ? `$${currentValue.toFixed(2)}` : '—'}
            sub="vs $100 base"
            icon={TrendingUp}
            color="text-indigo-600"
            bg="bg-indigo-100"
            trend={perfPct ? { value: `${perfPct}%`, up: isPositive } : undefined}
          />
          <StatCard
            title="DOT/USD Price"
            value={dotPrice !== null ? `$${dotPrice.toFixed(2)}` : '—'}
            sub="Oracle feed"
            icon={DollarSign}
            color="text-green-600"
            bg="bg-green-100"
          />
          <StatCard
            title="Total Staked"
            value={`${totalStaked.toFixed(2)} W3PI`}
            sub="Staking contract"
            icon={Lock}
            color="text-blue-600"
            bg="bg-blue-100"
          />
          <StatCard
            title="Portfolio Tokens"
            value={String(tokenCount)}
            sub={`Active tier: ${String(activeTier).replace('Tier', 'Tier ')}`}
            icon={Layers}
            color="text-purple-600"
            bg="bg-purple-100"
          />
        </div>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <Tabs defaultValue="index" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="index" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Index
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="staking" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Staking
            </TabsTrigger>
            <TabsTrigger value="fees" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Fees
            </TabsTrigger>
          </TabsList>

          {/* ── INDEX TAB ─────────────────────────────────────── */}
          <TabsContent value="index" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance line chart */}
              <Card>
                <CardHeader>
                  <SectionHeader
                    title="Index Performance"
                    description="W3PI value relative to $100 baseline"
                  />
                </CardHeader>
                <CardContent>
                  {indexSummaryQuery.isLoading ? (
                    <div className="h-[260px] flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                  ) : (
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={perfHistory} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="day" fontSize={12} tickLine={false} />
                          <YAxis
                            fontSize={12}
                            tickLine={false}
                            domain={['auto', 'auto']}
                            tickFormatter={(v) => `$${v}`}
                          />
                          <Tooltip
                            formatter={(v) => [typeof v === 'number' ? `$${v.toFixed(2)}` : v, 'Index Value']}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={isPositive ? '#10b981' : '#ef4444'}
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Index metrics */}
              <Card>
                <CardHeader>
                  <SectionHeader
                    title="Index Metrics"
                    description="Current on-chain index data"
                    onRefresh={() => indexSummaryQuery.refresh()}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Current Value', value: currentValue !== null ? `$${currentValue.toFixed(4)}` : '—' },
                    { label: 'Base Value', value: baseValue !== null ? `$${baseValue.toFixed(4)}` : '$100.00' },
                    {
                      label: 'Performance',
                      value: perfPct !== null ? `${Number(perfPct) >= 0 ? '+' : ''}${perfPct}%` : '—',
                      highlight: perfPct !== null ? (Number(perfPct) >= 0 ? 'text-green-600' : 'text-red-600') : '',
                    },
                    { label: 'State', value: String(stateQuery.data ?? '—') },
                    { label: 'Last Updated', value: lastUpdate ? formatDate(lastUpdate) : '—' },
                    { label: 'DOT/USD', value: dotPrice !== null ? `$${dotPrice.toFixed(4)}` : '—' },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm text-gray-500">{label}</span>
                      <span className={cn('font-semibold', highlight ?? '')}>{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── PORTFOLIO TAB ─────────────────────────────────── */}
          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Composition pie */}
              <Card>
                <CardHeader>
                  <SectionHeader
                    title="Token Composition"
                    description="Target weight allocation by token"
                    onRefresh={() => compositionQuery.refresh()}
                  />
                </CardHeader>
                <CardContent>
                  {compositionQuery.isLoading ? (
                    <div className="h-[280px] flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                  ) : compositionData.length === 0 ? (
                    <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
                      No tokens in portfolio
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="h-[220px] w-full md:w-1/2">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={compositionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={90}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {compositionData.map((entry, i) => (
                                <Cell key={i} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => [typeof v === 'number' ? `${v.toFixed(1)}%` : v, 'Weight']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full md:w-1/2 grid grid-cols-2 gap-1">
                        {compositionData.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-1.5 text-sm">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                            <span className="text-gray-700 truncate">{entry.name}</span>
                            <span className="text-gray-400 ml-auto">{entry.value.toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tier distribution */}
              <Card>
                <CardHeader>
                  <SectionHeader
                    title="Tier Distribution"
                    description="Token count per registry tier"
                    onRefresh={() => { tierDistQuery.refresh(); tokenCountQuery.refresh(); }}
                  />
                </CardHeader>
                <CardContent>
                  {tierDistQuery.isLoading ? (
                    <div className="h-[280px] flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                  ) : tierDist.length === 0 ? (
                    <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
                      No tier data available
                    </div>
                  ) : (
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tierDist} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" fontSize={12} tickLine={false} />
                          <YAxis fontSize={12} tickLine={false} allowDecimals={false} />
                          <Tooltip
                            formatter={(v) => [v, 'Tokens']}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {tierDist.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Active tier badge */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-gray-500">Active Tier:</span>
                    <Badge
                      style={{ backgroundColor: TIER_COLORS[activeTier] ?? '#6366f1' }}
                      className="text-white"
                    >
                      {String(activeTier).replace('Tier', 'Tier ')}
                    </Badge>
                    <span className="text-sm text-gray-500 ml-2">
                      {tokenCount} total tokens
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Portfolio stats summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Portfolio Capacity</CardTitle>
                <CardDescription>Token slot utilization</CardDescription>
              </CardHeader>
              <CardContent>
                {portfolioStatsQuery.data ? (() => {
                  const [total, active, max] = portfolioStatsQuery.data;
                  const pct = max > 0 ? Math.round((total / max) * 100) : 0;
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>{total} / {max} slots used</span>
                        <span className="font-semibold">{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className="h-3 rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4 pt-2 text-center">
                        <div>
                          <p className="text-2xl font-bold text-indigo-600">{total}</p>
                          <p className="text-xs text-gray-500">Total Tokens</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{active}</p>
                          <p className="text-xs text-gray-500">Active</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-600">{max}</p>
                          <p className="text-xs text-gray-500">Max Capacity</p>
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="animate-pulse space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-8 bg-gray-200 rounded w-1/2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── STAKING TAB ───────────────────────────────────── */}
          <TabsContent value="staking" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Total Staked"
                value={`${totalStaked.toFixed(2)}`}
                sub="W3PI tokens"
                icon={Lock}
                color="text-blue-600"
                bg="bg-blue-100"
              />
              <StatCard
                title="Rewards Pool"
                value={`${rewardsPool.toFixed(4)}`}
                sub="W3PI available"
                icon={Wallet}
                color="text-green-600"
                bg="bg-green-100"
              />
              <StatCard
                title="Total Distributed"
                value={`${totalDistributed.toFixed(4)}`}
                sub="W3PI lifetime rewards"
                icon={Activity}
                color="text-purple-600"
                bg="bg-purple-100"
              />
            </div>

            {/* Rewards breakdown radial */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rewards Breakdown</CardTitle>
                <CardDescription>Pool balance vs distributed vs staked tokens</CardDescription>
              </CardHeader>
              <CardContent>
                {totalStakedQuery.isLoading ? (
                  <div className="h-[240px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          cx="50%"
                          cy="50%"
                          innerRadius="20%"
                          outerRadius="90%"
                          data={[
                            { name: 'Rewards Pool', value: rewardsPool, fill: '#22c55e' },
                            { name: 'Distributed', value: totalDistributed, fill: '#8b5cf6' },
                            { name: 'Total Staked', value: totalStaked, fill: '#3b82f6' },
                          ]}
                        >
                          <RadialBar dataKey="value" background={{ fill: '#f1f5f9' }} />
                          <Tooltip formatter={(v) => [typeof v === 'number' ? `${v.toFixed(4)} W3PI` : v]} />
                          <Legend iconSize={10} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: 'Total Staked', value: totalStaked, color: 'bg-blue-500' },
                        { label: 'Rewards Pool', value: rewardsPool, color: 'bg-green-500' },
                        { label: 'Total Distributed', value: totalDistributed, color: 'bg-purple-500' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex items-center gap-3">
                          <div className={cn('w-3 h-3 rounded-full', color)} />
                          <div className="flex-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">{label}</span>
                              <span className="font-semibold">{value.toFixed(4)} W3PI</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── FEES TAB ──────────────────────────────────────── */}
          <TabsContent value="fees" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fee structure */}
              <Card>
                <CardHeader>
                  <SectionHeader
                    title="Fee Structure"
                    description="Current protocol fee configuration"
                    onRefresh={() => feeConfigQuery.refresh()}
                  />
                </CardHeader>
                <CardContent>
                  {feeConfigQuery.isLoading ? (
                    <div className="h-[200px] flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                  ) : feeData.length === 0 ? (
                    <p className="text-sm text-gray-500">Fee configuration unavailable</p>
                  ) : (
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={feeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" fontSize={12} tickLine={false} />
                          <YAxis
                            fontSize={12}
                            tickLine={false}
                            tickFormatter={(v) => `${v} bps`}
                          />
                          <Tooltip
                            formatter={(v, _name, props) => [
                              typeof v === 'number' ? `${v} bps (${props.payload.pct}%)` : v,
                              'Fee',
                            ]}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          />
                          <Bar dataKey="bps" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fees collected summary */}
              <Card>
                <CardHeader>
                  <SectionHeader
                    title="Fee Revenue"
                    description="Protocol fees collected to date"
                    onRefresh={() => feesCollectedQuery.refresh()}
                  />
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-indigo-50 rounded-xl p-6 text-center">
                    <p className="text-sm text-indigo-600 font-medium uppercase tracking-wider">Total Fees Collected</p>
                    <p className="text-4xl font-bold text-indigo-700 mt-2">
                      {feesCollectedQuery.isLoading ? '...' : `${feesCollected.toFixed(4)}`}
                    </p>
                    <p className="text-sm text-indigo-500 mt-1">W3PI</p>
                  </div>

                  {feeConfig && (
                    <div className="space-y-3">
                      {[
                        { label: 'Buy Fee', bps: feeConfig.buyFeeBp, note: 'Charged when buying W3PI' },
                        { label: 'Sell Fee', bps: feeConfig.sellFeeBp, note: 'Charged when selling W3PI' },
                        { label: 'Streaming Fee', bps: feeConfig.streamingFeeBp, note: 'Annual management fee' },
                      ].map(({ label, bps, note }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-xs text-gray-400">{note}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{(bps / 100).toFixed(2)}%</p>
                            <p className="text-xs text-gray-400">{bps} bps</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Info footer */}
        <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            All data is fetched directly from on-chain contracts on the Passet Hub Testnet.
            Performance history is estimated from the current index value relative to the $100 baseline.
            Connect your wallet for full data access.
          </p>
        </div>
      </div>
    </div>
  );
}
