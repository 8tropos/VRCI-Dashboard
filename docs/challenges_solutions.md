# Challenges and Solutions

## Major Challenges Encountered

### 1. TypinkProvider Network Configuration Issues

#### Problem
- **Error**: `NetworkId pop-testnet is not available`
- **Error**: `NetworkId development is not available`
- Various network ID mismatches between deployments and provider config

#### Root Cause
- Mismatch between network IDs in deployments vs supported networks
- Wrong RPC endpoints (rpc1 vs rpc2)
- Incorrect network configuration structure

#### Solution
```typescript
// Custom Pop Testnet configuration with working RPC
const customPopTestnet = {
    decimals: 10,
    faucetUrl: 'https://onboard.popnetwork.xyz',
    id: 'pop_testnet',  // Key: exact match with deployments
    logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/networks/pop-network.svg',
    name: 'POP Testnet',
    providers: ['wss://rpc2.paseo.popnetwork.xyz'], // Working RPC endpoint
    symbol: 'PAS',
}

// Deployments must match network ID exactly
export const deployments = [
  {
    id: ContractId.ORACLE,
    network: 'pop_testnet', // Must match customPopTestnet.id
    address: process.env.NEXT_PUBLIC_ORACLE_ADDRESS || 'placeholder',
    metadata: oracleMetadata as any,
  }
];
```

#### Lessons Learned
- Network IDs must match exactly between provider config and deployments
- Use working RPC endpoints (rpc2 instead of rpc1)
- Test network connectivity before proceeding

### 2. Contract Metadata Type Issues

#### Problem
- **Error**: `Type 'ContractMetadata' is not assignable to type 'string | ContractMetadata'`
- TypeScript compilation errors with imported JSON metadata

#### Root Cause
- Typink expects specific metadata version formats
- Generated metadata had version number conflicts
- Direct JSON imports vs string paths confusion

#### Solution
```typescript
// Import metadata directly and use type assertion
import oracleMetadata from './artifacts/oracle/oracle.json';

export const deployments = [
  {
    id: ContractId.ORACLE,
    network: 'pop_testnet',
    address: process.env.NEXT_PUBLIC_ORACLE_ADDRESS || 'placeholder',
    metadata: oracleMetadata as any, // Type assertion to bypass strict typing
  }
];
```

#### Lessons Learned
- Use `as any` type assertion for metadata compatibility
- Direct JSON imports work better than file paths
- Generated metadata versions may not match Typink expectations exactly

### 3. Typink Hook API Confusion

#### Problem
- **Error**: `Property 'selectedAccount' does not exist on type 'TypinkContextProps'`
- **Error**: `Property 'isConnected' does not exist on type 'TypinkContextProps'`
- Wrong hook names and property access

#### Root Cause
- Documentation examples were inconsistent
- Mixed up different wallet libraries (wagmi, useInkathon, etc.)
- Typink API differs from other Web3 libraries

#### Solution
```typescript
// Correct Typink API usage
const { 
  accounts,           // ✅ Available accounts array
  connectedAccount,   // ✅ Currently selected account
  setConnectedAccount,// ✅ Function to switch accounts
  disconnect,         // ✅ Disconnect function
  signer,            // ✅ Connection status indicator
  network,           // ✅ Current network info
  wallets,           // ✅ Available wallet extensions
  connectWallet,     // ✅ Connect to specific wallet
  connectedWallet    // ✅ Currently connected wallet info
} = useTypink();

// Separate hook for balances
const addresses = accounts?.map(account => account.address) || [];
const balances = useBalances(addresses);
```

#### Lessons Learned
- Always check official examples from the library maintainers
- Don't assume API similarity between different Web3 libraries
- Use TypeScript IntelliSense to discover available properties

### 4. Wallet Connection State Management

#### Problem
- Wallet connection appeared to work but no visual feedback
- "Connecting..." state persisted indefinitely
- No indication when connection succeeded

#### Root Cause
- Missing auto-selection of first account after wallet connection
- No proper state transitions for connection success
- Lack of connection timeout handling

#### Solution
```typescript
// Auto-select first account when accounts become available
useEffect(() => {
  if (accounts && accounts.length > 0 && !connectedAccount) {
    console.log('Auto-selecting first account:', accounts[0]);
    setConnectedAccount(accounts[0]);
  }
}, [accounts, connectedAccount, setConnectedAccount]);

// Show connection success feedback
useEffect(() => {
  if (signer && connectedAccount && isConnecting) {
    console.log('Connection successful!');
    setJustConnected(true);
    setIsConnecting(false);
    setTimeout(() => setJustConnected(false), 3000);
  }
}, [signer, connectedAccount, isConnecting]);

// Connection timeout handling
useEffect(() => {
  if (!signer && isConnecting) {
    const timeout = setTimeout(() => {
      console.log('Connection timeout, resetting...');
      setIsConnecting(false);
    }, 10000);
    return () => clearTimeout(timeout);
  }
}, [signer, isConnecting]);
```

#### Lessons Learned
- Always implement connection timeout mechanisms
- Auto-select accounts to improve UX
- Provide clear visual feedback for all connection states

### 5. RPC Endpoint Issues

#### Problem
- WebSocket connection failures to Pop Testnet
- `wss://rpc1.paseo.popnetwork.xyz/` not working

#### Root Cause
- Infrastructure changes in Pop Network
- Multiple RPC endpoints with different availability

#### Solution
```typescript
// Use the working RPC endpoint
const customPopTestnet = {
  providers: ['wss://rpc2.paseo.popnetwork.xyz/'], // rpc2 instead of rpc1
  // ... other config
}
```

#### Lessons Learned
- Always test RPC endpoints before deployment
- Have backup RPC endpoints ready
- Monitor network status and updates

## Development Best Practices Discovered

### 1. Debugging Strategies
```typescript
// Add debug logging for development
console.log('Wallet Connector State:', {
  signer: !!signer,
  connectedAccount: !!connectedAccount,
  accountsLength: accounts?.length || 0,
  isConnecting,
  connectedWallet: connectedWallet?.name
});

// Development-only debug panel
{process.env.NODE_ENV === 'development' && (
  <div className="debug-panel">
    <div>Signer: {signer ? '✅' : '❌'}</div>
    <div>Account: {connectedAccount ? '✅' : '❌'}</div>
    <div>Accounts: {accounts?.length || 0}</div>
  </div>
)}
```

### 2. Error Handling
```typescript
// Comprehensive error handling
const handleWalletSelect = async (walletId: string) => {
  try {
    setIsConnecting(true);
    await connectWallet(walletId);
    setIsWalletModalOpen(false);
  } catch (err) {
    console.error('Failed to connect wallet:', err);
    setIsConnecting(false);
  }
};
```

### 3. Type Safety
```typescript
// Use proper TypeScript definitions
interface WalletState {
  signer: boolean;
  connectedAccount?: Account;
  accounts: Account[];
  isConnecting: boolean;
}
```

## Tools and Resources That Helped

### Documentation Sources
1. **Official Typink Tutorial**: https://docs.dedot.dev/help-and-faq/tutorials/develop-ink-dapp-using-typink
2. **Typink GitHub Examples**: https://github.com/dedotdev/typink-app
3. **ink! Documentation**: https://use.ink/docs/v5/frontend/overview
4. **Pop Network Docs**: https://learn.onpop.io/

### Debugging Tools
1. **Browser Console** - Essential for connection debugging
2. **React DevTools** - Component state inspection
3. **Network Tab** - RPC connection monitoring
4. **TypeScript Compiler** - Type error identification