# API Layer Documentation

This directory contains the modular API layer for the W3PI project, serving as the single source of truth for contract data and off-chain persistence.

## Architecture

- **API Routes**: Next.js App Router routes in `src/app/api/`
- **React Query Hooks**: Client-side data fetching hooks in `src/hooks/api/`
- **Validation**: Zod schemas in `src/lib/api/schemas.ts`
- **Types**: TypeScript types in `src/lib/api/types.ts`

## API Endpoints

### 1. `/api/contracts`
**GET** - List all deployed contracts from the metadata folder

**Response:**
```json
{
  "success": true,
  "data": ["oracle", "registry", "token", "portfolio", "staking", "dex"]
}
```

### 2. `/api/contracts/[name]/methods`
**GET** - Fetch contract metadata (methods, types, docs)

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "oracle",
    "version": "0.1.0",
    "messages": [...],
    "constructors": [...]
  }
}
```

### 3. `/api/contracts/[name]/call`
**POST** - Generic contract read (query) operation

**Request:**
```json
{
  "method": "get_validation_config",
  "args": [],
  "address": "5FfE3Ag89mRLTh3hsoLA2caKxLwt3DPderEqcSTmYG5rLh3d"
}
```

**Response:**
```json
{
  "success": true,
  "data": {...}
}
```

### 4. `/api/contracts/[name]/tx`
**POST** - Generic contract write (transaction) operation

**Request:**
```json
{
  "method": "update_dot_usd_price",
  "args": [1000000],
  "signer": "5FfE3Ag89mRLTh3hsoLA2caKxLwt3DPderEqcSTmYG5rLh3d",
  "value": "0"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "extrinsic": {...}
  }
}
```

### 5. `/api/state`
**GET** - Get off-chain state (wallets, logs, etc.)

**Query Parameters:**
- `type`: `wallets` | `logs` (default: `wallets`)
- `walletId`: Filter logs by wallet ID
- `contract`: Filter logs by contract name

**POST** - Create off-chain state

**Request:**
```json
{
  "type": "wallet",
  "address": "5FfE3Ag89mRLTh3hsoLA2caKxLwt3DPderEqcSTmYG5rLh3d",
  "chainId": "pop_testnet"
}
```

or

```json
{
  "type": "log",
  "walletId": "clx...",
  "contract": "oracle",
  "method": "update_dot_usd_price",
  "status": "pending",
  "txHash": "0x...",
  "data": {...}
}
```

### 6. `/api/health`
**GET** - System heartbeat and version info

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "0.1.0",
    "timestamp": "2025-01-XX...",
    "services": {
      "api": "up",
      "database": "up",
      "polkadot": "up"
    },
    "uptime": 123
  }
}
```

### 7. `/api/oracle`
**GET** - Fetch live token data (price, market cap, volume, ATH/ATL) from external APIs

**Query Parameters:**
- `symbols`: Comma-separated list of token symbols (e.g., "BTC,ETH,DOT")

**Response:**
```json
{
  "success": true,
  "data": {
    "BTC": {
      "symbol": "BTC",
      "price": 43250.50,
      "marketCap": 850000000000,
      "volume24h": 25000000000,
      "ath": 69000.00,
      "atl": 0.05,
      "supply": 19600000,
      "source": "coinmarketcap"
    },
    "ETH": {
      "symbol": "ETH",
      "price": 2650.75,
      "marketCap": 320000000000,
      "volume24h": 12000000000,
      "ath": 4878.26,
      "atl": 0.42,
      "supply": 120000000,
      "source": "coinmarketcap"
    }
  }
}
```

**Features:**
- Primary source: CoinMarketCap (requires `CMC_API_KEY` in `.env`)
- Fallback sources: cryptorates.ai and cryptoprices.cc
- Automatic fallback chain if primary source fails
- Normalized output format across all sources
- Runtime validation with Zod schemas

## React Query Hooks

### `useContractsQuery()`
Fetch all available contracts.

```typescript
import { useContractsQuery } from '@/hooks/api';

function ContractsList() {
  const { data: contracts, isLoading, error } = useContractsQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {contracts?.map((name) => (
        <li key={name}>{name}</li>
      ))}
    </ul>
  );
}
```

### `useContractMethods(contractName)`
Fetch contract methods and metadata.

```typescript
import { useContractMethods } from '@/hooks/api';

function ContractMethods({ contractName }: { contractName: string }) {
  const { data: metadata, isLoading } = useContractMethods(contractName);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>{metadata?.name}</h2>
      <ul>
        {metadata?.messages.map((method) => (
          <li key={method.label}>
            {method.label} {method.mutates ? '(write)' : '(read)'}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### `useContractCall(contractName, request)`
Call a contract method (read operation).

```typescript
import { useContractCall } from '@/hooks/api';

function ContractData({ contractName }: { contractName: string }) {
  const { data, isLoading } = useContractCall(
    contractName,
    {
      method: 'get_validation_config',
      args: [],
    },
    { staleTime: 30000 }
  );

  if (isLoading) return <div>Loading...</div>;

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

### `useContractTx(contractName)`
Execute a contract transaction (write operation).

```typescript
import { useContractTx } from '@/hooks/api';

function UpdatePrice({ contractName }: { contractName: string }) {
  const mutation = useContractTx(contractName);

  const handleUpdate = async () => {
    try {
      const result = await mutation.mutateAsync({
        method: 'update_dot_usd_price',
        args: [1000000],
        signer: '5FfE3Ag89mRLTh3hsoLA2caKxLwt3DPderEqcSTmYG5rLh3d',
      });
      console.log('Transaction prepared:', result);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <button onClick={handleUpdate} disabled={mutation.isPending}>
      {mutation.isPending ? 'Updating...' : 'Update Price'}
    </button>
  );
}
```

### `useContractTxOptimistic(contractName)`
Execute a contract transaction with optimistic updates.

```typescript
import { useContractTxOptimistic } from '@/hooks/api';

function OptimisticUpdate({ contractName }: { contractName: string }) {
  const mutation = useContractTxOptimistic(contractName);

  // Same usage as useContractTx, but with automatic optimistic UI updates
  // The UI will update immediately, then roll back if the mutation fails
}
```

### `useStateQuery(options)`
Fetch off-chain state.

```typescript
import { useStateQuery } from '@/hooks/api';

function WalletsList() {
  const { data: wallets, isLoading } = useStateQuery({ type: 'wallets' });

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {wallets?.map((wallet) => (
        <li key={wallet.id}>{wallet.address}</li>
      ))}
    </ul>
  );
}
```

### `useStateMutation()`
Create/update off-chain state.

```typescript
import { useStateMutation } from '@/hooks/api';

function CreateWallet() {
  const mutation = useStateMutation();

  const handleCreate = async () => {
    try {
      const wallet = await mutation.mutateAsync({
        type: 'wallet',
        address: '5FfE3Ag89mRLTh3hsoLA2caKxLwt3DPderEqcSTmYG5rLh3d',
        chainId: 'pop_testnet',
      });
      console.log('Wallet created:', wallet);
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  return (
    <button onClick={handleCreate} disabled={mutation.isPending}>
      {mutation.isPending ? 'Creating...' : 'Create Wallet'}
    </button>
  );
}
```

### `useHealthQuery()`
Fetch system health status.

```typescript
import { useHealthQuery } from '@/hooks/api';

function HealthStatus() {
  const { data: health, isLoading } = useHealthQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>Status: {health?.status}</p>
      <p>Version: {health?.version}</p>
      <p>Database: {health?.services.database}</p>
      <p>Polkadot: {health?.services.polkadot}</p>
    </div>
  );
}
```

### `useOracleQuery(symbols[])`
Fetch live token data from Oracle API (CoinMarketCap with fallbacks).

```typescript
import { useOracleQuery } from '@/hooks/api';

function TokenPrices() {
  const { data: tokenData, isLoading, error } = useOracleQuery(['BTC', 'ETH', 'DOT'], {
    staleTime: 60 * 1000, // 60 seconds
  });

  if (isLoading) return <div>Loading token data...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {Object.values(tokenData || {}).map((token) => (
        <div key={token.symbol}>
          <h3>{token.symbol}</h3>
          <p>Price: ${token.price.toLocaleString()}</p>
          <p>Market Cap: ${token.marketCap?.toLocaleString() || 'N/A'}</p>
          <p>24h Volume: ${token.volume24h?.toLocaleString() || 'N/A'}</p>
          <p>Source: {token.source}</p>
        </div>
      ))}
    </div>
  );
}
```

### `useOracleTokenQuery(symbol)`
Fetch data for a single token.

```typescript
import { useOracleTokenQuery } from '@/hooks/api';

function BitcoinPrice() {
  const { data: btcData, isLoading } = useOracleTokenQuery('BTC');

  if (isLoading) return <div>Loading...</div>;
  if (!btcData) return <div>No data available</div>;

  return (
    <div>
      <h2>Bitcoin (BTC)</h2>
      <p>Price: ${btcData.price.toLocaleString()}</p>
      <p>ATH: ${btcData.ath?.toLocaleString() || 'N/A'}</p>
      <p>ATL: ${btcData.atl?.toLocaleString() || 'N/A'}</p>
    </div>
  );
}
```

## Environment Variables

Add to your `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/w3pi?schema=public"

# Polkadot RPC
NEXT_PUBLIC_RPC_URL="wss://rpc1.paseo.popnetwork.xyz"

# CoinMarketCap API (server-side only)
CMC_API_KEY=your_coinmarketcap_api_key_here

# Contract Addresses
NEXT_PUBLIC_ORACLE_ADDRESS=5FfE3Ag89mRLTh3hsoLA2caKxLwt3DPderEqcSTmYG5rLh3d
NEXT_PUBLIC_REGISTRY_ADDRESS=5GAVvqzi5ap5U2UQfAhYd8271eJDwz2HwygZTvbtExYDcSG2
NEXT_PUBLIC_TOKEN_ADDRESS=5FRfPVmGAPjYrJdgBqURYs717SBi3K6QZb7d58tvsUq5X1cX
NEXT_PUBLIC_PORTFOLIO_ADDRESS=5E5sWGsDoQMQTqT21gHVh1E1aR5pGhPGZyoTKKVTYjry2zvN
NEXT_PUBLIC_STAKING_ADDRESS=...
NEXT_PUBLIC_DEX_ADDRESS=...
```

**Note:** `CMC_API_KEY` is server-side only and will not be exposed to the client. If not provided, the Oracle API will automatically fall back to cryptorates.ai and cryptoprices.cc.

## Database Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Prisma:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

3. (Optional) Open Prisma Studio:
```bash
npx prisma studio
```

## Notes

- All API responses follow the format: `{ success: boolean, data?: T, error?: string }`
- React Query handles all caching automatically
- No external caching service (Redis/Upstash) is used
- All inputs are validated with Zod schemas
- All endpoints are fully typed with TypeScript

