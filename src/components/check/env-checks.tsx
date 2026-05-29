import Link from 'next/link';
import { AlertTriangle, CheckCircle2, CircleHelp, Network, ShieldCheck, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RuntimeChecks } from '@/components/check/runtime-checks';
import { getAssetHubPaseoAccountUrl, SubscanAccountLink } from '@/components/check/subscan-account-link';
import { getRpcProviderUrls } from '@/lib/rpc';

export type CheckMode = 'development' | 'production';

type CheckStatus = 'pass' | 'warn' | 'fail' | 'info';

interface CheckRow {
  id: string;
  label: string;
  status: CheckStatus;
  value: string;
  detail: string;
  href?: string;
}

const H160_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

const CONTRACT_ENV_KEYS = [
  'TOKEN',
  'ORACLE',
  'REGISTRY',
  'PORTFOLIO',
  'STAKING',
  'DEX',
] as const;

const SERVER_ENV_KEYS = [
  'DATABASE_URL',
  'DATABASE_URL_UNPOOLED',
  'CMC_API_KEY',
] as const;

const PUBLIC_OPTIONAL_ENV_KEYS = [
  'NEXT_PUBLIC_USDC_TOKEN_ADDRESS',
] as const;

function getEnv(name: string): string {
  return process.env[name]?.trim() ?? '';
}

function getCurrentMode(): CheckMode | 'other' {
  if (process.env.NODE_ENV === 'development') return 'development';
  if (process.env.NODE_ENV === 'production') return 'production';
  return 'other';
}

function maskValue(value: string, visible = 6): string {
  if (!value) return 'Missing';
  if (value.length <= visible * 2 + 3) return value;
  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
}

function presenceLabel(value: string): string {
  return value ? 'Set' : 'Missing';
}

function statusCounts(rows: CheckRow[]) {
  return rows.reduce(
    (counts, row) => {
      counts[row.status] += 1;
      return counts;
    },
    { pass: 0, warn: 0, fail: 0, info: 0 } satisfies Record<CheckStatus, number>
  );
}

function getStatusClasses(status: CheckStatus): string {
  switch (status) {
    case 'pass':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300';
    case 'warn':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300';
    case 'fail':
      return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300';
    case 'info':
      return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300';
  }
}

function StatusBadge({ status }: { status: CheckStatus }) {
  const Icon =
    status === 'pass'
      ? CheckCircle2
      : status === 'fail'
        ? XCircle
        : status === 'warn'
          ? AlertTriangle
          : CircleHelp;

  return (
    <Badge variant="outline" className={getStatusClasses(status)}>
      <Icon className="h-3 w-3" />
      {status.toUpperCase()}
    </Badge>
  );
}

function getContractEnvRows(mode: CheckMode): CheckRow[] {
  const shouldLinkAddresses = mode === 'development';

  return CONTRACT_ENV_KEYS.flatMap((contractName) => {
    const baseKey = `NEXT_PUBLIC_${contractName}_ADDRESS`;
    const devKey = `${baseKey}_DEV`;
    const baseValue = getEnv(baseKey);
    const devValue = getEnv(devKey);

    if (mode === 'production') {
      return [
        {
          id: `${contractName}-production`,
          label: `${contractName} production address`,
          status: baseValue
            ? H160_ADDRESS_PATTERN.test(baseValue)
              ? 'pass'
              : 'fail'
            : 'fail',
          value: baseValue ? maskValue(baseValue, 8) : 'Missing',
          href: shouldLinkAddresses && H160_ADDRESS_PATTERN.test(baseValue) ? getAssetHubPaseoAccountUrl(baseValue) : undefined,
          detail: `Production reads ${baseKey}. ${devKey} is ignored.`,
        },
        {
          id: `${contractName}-production-dev-ignored`,
          label: `${devKey}`,
          status: devValue ? 'info' : 'info',
          value: devValue ? maskValue(devValue, 8) : 'Missing',
          href: shouldLinkAddresses && H160_ADDRESS_PATTERN.test(devValue) ? getAssetHubPaseoAccountUrl(devValue) : undefined,
          detail: 'Shown for visibility only. Production does not use this value.',
        },
      ];
    }

    const activeValue = devValue || baseValue;
    const activeSource = devValue ? devKey : baseKey;

    return [
      {
        id: `${contractName}-development-active`,
        label: `${contractName} development address`,
        status: activeValue
          ? H160_ADDRESS_PATTERN.test(activeValue)
            ? 'pass'
            : 'fail'
          : 'fail',
        value: activeValue ? maskValue(activeValue, 8) : 'Missing',
        href: shouldLinkAddresses && H160_ADDRESS_PATTERN.test(activeValue) ? getAssetHubPaseoAccountUrl(activeValue) : undefined,
        detail: `Development reads ${devKey} first, then falls back to ${baseKey}. Active source: ${activeSource}.`,
      },
      {
        id: `${contractName}-development-dev`,
        label: `${devKey}`,
        status: devValue
          ? H160_ADDRESS_PATTERN.test(devValue)
            ? 'pass'
            : 'fail'
          : 'warn',
        value: devValue ? maskValue(devValue, 8) : 'Missing',
        href: shouldLinkAddresses && H160_ADDRESS_PATTERN.test(devValue) ? getAssetHubPaseoAccountUrl(devValue) : undefined,
        detail: 'Preferred development value.',
      },
      {
        id: `${contractName}-development-base-fallback`,
        label: `${baseKey}`,
        status: baseValue
          ? H160_ADDRESS_PATTERN.test(baseValue)
            ? 'pass'
            : 'fail'
          : devValue
            ? 'info'
            : 'warn',
        value: baseValue ? maskValue(baseValue, 8) : 'Missing',
        href: shouldLinkAddresses && H160_ADDRESS_PATTERN.test(baseValue) ? getAssetHubPaseoAccountUrl(baseValue) : undefined,
        detail: 'Fallback for development and required value for production.',
      },
    ];
  });
}

function getRpcRows(mode: CheckMode): CheckRow[] {
  const rpcBase = getEnv('NEXT_PUBLIC_RPC_URL');
  const rpcDev = getEnv('NEXT_PUBLIC_RPC_URL_DEV');

  if (mode === 'production') {
    const providers = getRpcProviderUrls(rpcBase);

    return [
      {
        id: 'rpc-production-active',
        label: 'Production RPC URL',
        status: rpcBase ? (rpcBase.startsWith('ws') ? 'pass' : 'warn') : 'warn',
        value: rpcBase ? maskValue(rpcBase, 14) : maskValue(providers[0], 14),
        detail: rpcBase
          ? 'Production reads NEXT_PUBLIC_RPC_URL only.'
          : 'No production RPC env is set; app will use the built-in fallback provider.',
      },
      {
        id: 'rpc-production-dev-ignored',
        label: 'NEXT_PUBLIC_RPC_URL_DEV',
        status: 'info',
        value: rpcDev ? maskValue(rpcDev, 14) : 'Missing',
        detail: 'Shown for visibility only. Production ignores this value.',
      },
    ];
  }

  const providers = getRpcProviderUrls(rpcDev, rpcBase);
  const activeRpc = rpcDev || rpcBase;

  return [
    {
      id: 'rpc-development-active',
      label: 'Development RPC URL',
      status: activeRpc ? (activeRpc.startsWith('ws') ? 'pass' : 'warn') : 'warn',
      value: activeRpc ? maskValue(activeRpc, 14) : maskValue(providers[0], 14),
      detail: activeRpc
        ? 'Development reads NEXT_PUBLIC_RPC_URL_DEV first, then falls back to NEXT_PUBLIC_RPC_URL.'
        : 'No RPC env value set; app will use the built-in fallback provider.',
    },
    {
      id: 'rpc-development-dev',
      label: 'NEXT_PUBLIC_RPC_URL_DEV',
      status: rpcDev ? (rpcDev.startsWith('ws') ? 'pass' : 'warn') : 'warn',
      value: rpcDev ? maskValue(rpcDev, 14) : 'Missing',
      detail: 'Preferred development RPC value.',
    },
    {
      id: 'rpc-development-base-fallback',
      label: 'NEXT_PUBLIC_RPC_URL',
      status: rpcBase ? (rpcBase.startsWith('ws') ? 'pass' : 'warn') : rpcDev ? 'info' : 'warn',
      value: rpcBase ? maskValue(rpcBase, 14) : 'Missing',
      detail: 'Fallback for development and required value for production.',
    },
  ];
}

function getServerRows(): CheckRow[] {
  return SERVER_ENV_KEYS.map((key) => {
    const value = getEnv(key);
    return {
      id: key,
      label: key,
      status: value ? 'pass' : key === 'DATABASE_URL' ? 'fail' : 'warn',
      value: presenceLabel(value),
      detail:
        key === 'DATABASE_URL'
          ? 'Required by Prisma routes and build/start migrations.'
          : 'Server-only value. Presence is shown without exposing the secret.',
    };
  });
}

function getOptionalPublicRows(mode: CheckMode): CheckRow[] {
  const shouldLinkAddresses = mode === 'development';

  return PUBLIC_OPTIONAL_ENV_KEYS.flatMap((baseKey) => {
    const devKey = `${baseKey}_DEV`;
    const baseValue = getEnv(baseKey);
    const devValue = getEnv(devKey);
    const keys =
      mode === 'development'
        ? [
            {
              key: devKey,
              value: devValue,
              detail: 'Preferred development value for optional public token utilities.',
            },
            {
              key: baseKey,
              value: baseValue,
              detail: 'Fallback for development and production value for optional public token utilities.',
            },
          ]
        : [
            {
              key: baseKey,
              value: baseValue,
              detail: 'Production value for optional public token utilities.',
            },
            {
              key: devKey,
              value: devValue,
              detail: 'Shown for visibility only. Production ignores this value.',
            },
          ];

    return keys.map(({ key, value, detail }) => ({
      id: key,
      label: key,
      status: value ? (H160_ADDRESS_PATTERN.test(value) ? 'pass' : 'fail') : 'info' as CheckStatus,
      value: value ? maskValue(value, 8) : 'Missing',
      href: shouldLinkAddresses && H160_ADDRESS_PATTERN.test(value) ? getAssetHubPaseoAccountUrl(value) : undefined,
      detail,
    }));
  });
}

function getProcessEnvRows(mode: CheckMode): CheckRow[] {
  const currentMode = getCurrentMode();

  return [
    {
      id: 'node-env',
      label: 'Current NODE_ENV',
      status: currentMode === mode ? 'pass' : currentMode === 'other' ? 'warn' : 'info',
      value: process.env.NODE_ENV || 'Missing',
      detail:
        currentMode === mode
          ? `The running app is currently using ${mode} resolution rules.`
          : `This page validates ${mode} env names; the running app is currently ${process.env.NODE_ENV || 'unset'}.`,
    },
    {
      id: 'expected-network',
      label: 'Expected Typink network',
      status: 'info',
      value: 'passet_hub_testnet',
      detail: 'Configured chain id is 420420422 and symbol is PAS.',
    },
    ...getRpcRows(mode),
    ...getContractEnvRows(mode),
    ...getServerRows(),
    ...getOptionalPublicRows(mode),
  ];
}

function SummaryCard({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: CheckStatus;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

function ChecksTable({ rows }: { rows: CheckRow[] }) {
  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[140px]">Status</TableHead>
          <TableHead className="w-[260px]">Check</TableHead>
          <TableHead className="w-[220px]">Value</TableHead>
          <TableHead className="w-[280px]">Detail</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <StatusBadge status={row.status} />
            </TableCell>
            <TableCell className="font-medium whitespace-normal">{row.label}</TableCell>
            <TableCell className="font-mono text-xs whitespace-normal break-all">
              <SubscanAccountLink href={row.href}>{row.value}</SubscanAccountLink>
            </TableCell>
            <TableCell className="text-muted-foreground whitespace-normal leading-relaxed">
              {row.detail}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function EnvChecksPage({ mode }: { mode: CheckMode }) {
  const processEnvRows = getProcessEnvRows(mode);
  const counts = statusCounts(processEnvRows);
  const currentMode = getCurrentMode();
  const title = mode === 'development' ? 'Development Checks' : 'Production Checks';
  const otherMode = mode === 'development' ? 'production' : 'development';

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">
            {mode === 'development'
              ? 'Validates _DEV values and the base fallback used by next dev.'
              : 'Validates base values used by production builds and runtime.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-sm">
            NODE_ENV: {process.env.NODE_ENV || 'unset'}
          </Badge>
          <Link
            href={`/check/${otherMode}`}
            className="inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            {otherMode === 'development' ? 'Development' : 'Production'}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Passing" value={counts.pass} status="pass" />
        <SummaryCard label="Warnings" value={counts.warn} status="warn" />
        <SummaryCard label="Failures" value={counts.fail} status="fail" />
        <SummaryCard label="Info" value={counts.info} status="info" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {mode === 'development' ? 'Development Env Checks' : 'Production Env Checks'}
          </CardTitle>
          <CardDescription>
            Server-only values show presence only. Public values are shortened.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChecksTable rows={processEnvRows} />
        </CardContent>
      </Card>

      {currentMode === mode ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Runtime Checks
            </CardTitle>
            <CardDescription>
              Browser-side checks from Typink, the connected wallet, and loaded deployments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RuntimeChecks enableSubscanLinks={mode === 'development'} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Runtime Checks
            </CardTitle>
            <CardDescription>
              Runtime checks are shown only for the active NODE_ENV mode.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This page is checking {mode} env names, but the running app is currently{' '}
            <span className="font-mono text-foreground">{process.env.NODE_ENV || 'unset'}</span>.
            Open the {currentMode === 'development' ? 'development' : 'production'} checks page to inspect Typink runtime state.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
