'use client';

import { AlertTriangle, CheckCircle2, CircleHelp, XCircle } from 'lucide-react';
import { useCheckMappedAccount, useContract, useTypink } from 'typink';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getAssetHubPaseoAccountUrl, SubscanAccountLink } from '@/components/check/subscan-account-link';
import { CONTRACT_ADDRESSES, PASSET_HUB_NETWORK, deployments } from '@/providers/TypinkProvider';
import type { DexContractApi } from '@/lib/contracts/dex';
import type { OracleContractApi } from '@/lib/contracts/oracle';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import type { RegistryContractApi } from '@/lib/contracts/registry';
import type { StakingContractApi } from '@/lib/contracts/staking';
import type { TokenContractApi } from '@/lib/contracts/token';

type CheckStatus = 'pass' | 'warn' | 'fail' | 'info';

interface RuntimeCheckRow {
  id: string;
  label: string;
  status: CheckStatus;
  value: string;
  detail: string;
  href?: string;
}

const H160_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

function maskValue(value: string, visible = 8): string {
  if (!value) return 'Missing';
  if (value.length <= visible * 2 + 3) return value;
  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
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

function getMetadataMessageCount(metadata: unknown): number {
  if (!metadata || typeof metadata !== 'object') return 0;

  const maybeSpec = metadata as {
    spec?: {
      messages?: unknown[];
    };
  };

  return Array.isArray(maybeSpec.spec?.messages)
    ? maybeSpec.spec.messages.length
    : 0;
}

export function RuntimeChecks({ enableSubscanLinks = true }: { enableSubscanLinks?: boolean }) {
  const typink = useTypink();
  const mapping = useCheckMappedAccount();
  const { contract: tokenContract } = useContract<TokenContractApi>('token');
  const { contract: oracleContract } = useContract<OracleContractApi>('oracle');
  const { contract: registryContract } = useContract<RegistryContractApi>('registry');
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const { contract: stakingContract } = useContract<StakingContractApi>('staking');
  const { contract: dexContract } = useContract<DexContractApi>('dex');

  const connectionStatus = typink.connectionStatus.get(PASSET_HUB_NETWORK.id);
  const accountAddress = typink.connectedAccount?.address ?? '';

  const rows: RuntimeCheckRow[] = [
    {
      id: 'typink-network',
      label: 'Typink network',
      status: typink.network.id === PASSET_HUB_NETWORK.id ? 'pass' : 'fail',
      value: typink.network.id,
      detail: `Expected ${PASSET_HUB_NETWORK.id}.`,
    },
    {
      id: 'typink-connection',
      label: 'Typink connection',
      status: typink.ready ? 'pass' : connectionStatus === 'Error' ? 'fail' : 'warn',
      value: connectionStatus ?? 'Unknown',
      detail: typink.ready ? 'Client is ready.' : 'Client is not ready yet.',
    },
    {
      id: 'wallet-account',
      label: 'Connected wallet',
      status: accountAddress ? 'pass' : 'warn',
      value: accountAddress ? maskValue(accountAddress) : 'Not connected',
      href: enableSubscanLinks && accountAddress ? getAssetHubPaseoAccountUrl(accountAddress) : undefined,
      detail: accountAddress
        ? `Wallet source: ${typink.connectedAccount?.source ?? 'unknown'}.`
        : 'Connect a wallet to check revive mapping.',
    },
    {
      id: 'revive-mapping',
      label: 'Revive account mapping',
      status: !accountAddress
        ? 'warn'
        : mapping.isLoading
          ? 'info'
          : mapping.error
            ? 'fail'
            : mapping.isMapped
              ? 'pass'
              : 'fail',
      value: !accountAddress
        ? 'Not checked'
        : mapping.isLoading
          ? 'Checking'
          : mapping.error
            ? 'Error'
            : mapping.isMapped
              ? 'Mapped'
              : 'Not mapped',
      href: enableSubscanLinks && mapping.evmAddress ? getAssetHubPaseoAccountUrl(mapping.evmAddress) : undefined,
      detail: mapping.error
        ? mapping.error.message
        : mapping.evmAddress
          ? `Revive address ${maskValue(mapping.evmAddress)}.`
          : 'Mapping is required before contract transactions can dry-run and submit.',
    },
  ];

  const contractRows: RuntimeCheckRow[] = [
    ['TOKEN', 'token', CONTRACT_ADDRESSES.TOKEN, tokenContract],
    ['ORACLE', 'oracle', CONTRACT_ADDRESSES.ORACLE, oracleContract],
    ['REGISTRY', 'registry', CONTRACT_ADDRESSES.REGISTRY, registryContract],
    ['PORTFOLIO', 'portfolio', CONTRACT_ADDRESSES.PORTFOLIO, portfolioContract],
    ['STAKING', 'staking', CONTRACT_ADDRESSES.STAKING, stakingContract],
    ['DEX', 'dex', CONTRACT_ADDRESSES.DEX, dexContract],
  ].flatMap(([label, id, address, contract]) => {
    const deployment = deployments.find((item) => item.id === id);
    const messageCount = getMetadataMessageCount(deployment?.metadata);
    const addressStatus: CheckStatus = !address
      ? 'fail'
      : H160_ADDRESS_PATTERN.test(String(address))
        ? 'pass'
        : 'fail';

    return [
      {
        id: `${id}-address`,
        label: `${label} deployment address`,
        status: addressStatus,
        value: address ? maskValue(String(address)) : 'Missing',
        href: enableSubscanLinks && addressStatus === 'pass' ? getAssetHubPaseoAccountUrl(String(address)) : undefined,
        detail: addressStatus === 'pass'
          ? 'Address shape is valid H160.'
          : 'Expected H160 0x address with 40 hex characters.',
      },
      {
        id: `${id}-metadata`,
        label: `${label} metadata`,
        status: messageCount > 0 ? 'pass' : 'fail',
        value: `${messageCount} messages`,
        detail: deployment ? 'Metadata JSON is loaded into Typink deployments.' : 'Deployment entry is missing.',
      },
      {
        id: `${id}-contract`,
        label: `${label} Typink contract`,
        status: contract ? 'pass' : address ? 'warn' : 'fail',
        value: contract ? 'Loaded' : 'Unavailable',
        detail: contract
          ? 'Contract object is available to hooks.'
          : 'Contract object is not available yet. Check connection, network, address, and metadata.',
      },
    ];
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[150px]">Status</TableHead>
          <TableHead>Check</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Detail</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...rows, ...contractRows].map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <StatusBadge status={row.status} />
            </TableCell>
            <TableCell className="font-medium whitespace-normal">{row.label}</TableCell>
            <TableCell className="font-mono text-xs whitespace-normal break-all">
              <SubscanAccountLink href={row.href}>{row.value}</SubscanAccountLink>
            </TableCell>
            <TableCell className="text-muted-foreground whitespace-normal">
              {row.detail}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
