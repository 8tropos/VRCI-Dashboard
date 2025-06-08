# Architecture Decisions & Rationale

## Technology Choices

### 1. Typink vs Other Web3 Libraries

#### Decision: Chose Typink over useInkathon, @polkadot/api-contract

#### Rationale:
- **Type Safety**: Fully type-safe React hooks for ink! contracts
- **Official Support**: Recommended by ink! documentation
- **Modern Approach**: Built on Dedot, next-generation Polkadot client
- **Developer Experience**: Better auto-completion and IntelliSense
- **Future-Proof**: Active development and community support

#### Trade-offs:
- **Pros**: Better DX, type safety, modern architecture
- **Cons**: Newer library, smaller community, fewer examples

#### Alternative Considered:
```typescript
// useInkathon approach
import { useInkathon, useContract } from '@scio-labs/use-inkathon';

// @polkadot/api-contract approach  
import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
```

### 2. Next.js 15 App Router vs Pages Router

#### Decision: Used App Router with Next.js 15

#### Rationale:
- **Modern Patterns**: Server Components and improved routing
- **Better Performance**: Optimized bundle sizes and loading
- **Future Direction**: Official recommendation from Vercel
- **TypeScript Integration**: Better type safety with app directory

#### Implementation:
```typescript
// App Router structure
src/app/
├── layout.tsx       # Root layout with providers
├── page.tsx         # Homepage
├── globals.css      # Global styles
└── loading.tsx      # Loading states
```

### 3. Pop Testnet vs Other Networks

#### Decision: Used Pop Testnet instead of Rococo Contracts or local node

#### Rationale:
- **Stability**: More stable than local development nodes
- **Real Environment**: Closer to production conditions
- **ink! Optimization**: Designed specifically for ink! contracts
- **Community**: Active developer community and support
- **Faucet Availability**: Easy to get test tokens

#### Configuration:
```typescript
const customPopTestnet = {
  id: 'pop_testnet',
  name: 'POP Testnet',
  providers: ['wss://rpc2.paseo.popnetwork.xyz/'],
  symbol: 'PAS',
  decimals: 10,
};
```

### 4. File Naming Convention: Kebab-case

#### Decision: Used kebab-case for file names

#### Rationale:
- **Consistency**: Matches Next.js conventions
- **URL Compatibility**: Works well with routing
- **Team Preference**: Developer preference stated explicitly
- **Tool Compatibility**: Works across different operating systems

#### Examples:
```
wallet-connector.tsx    ✅
main-provider.tsx      ✅
WalletConnector.tsx    ❌
mainProvider.tsx       ❌
```

## State Management Decisions

### 1. React Context vs External State Management

#### Decision: Used React Context with Typink hooks

#### Rationale:
- **Simplicity**: No need for Redux/Zustand for current scope
- **Integration**: Typink provides state management out of the box
- **Performance**: Sufficient for wallet and contract state
- **Maintenance**: Fewer dependencies to manage

#### Architecture:
```typescript
MainProvider (Typink)
└── AppProvider (Contract Context)
    └── Components (useTypink, useApp hooks)
```

### 2. Local State vs Global State

#### Decision: Mixed approach based on scope

#### Rationale:
- **Global**: Wallet connection, network, contracts (via Typink)
- **Local**: UI state, modals, dropdowns (useState)
- **Performance**: Avoids unnecessary re-renders
- **Clarity**: Clear separation of concerns

#### Examples:
```typescript
// Global state (Typink)
const { accounts, connectedAccount, signer } = useTypink();

// Local state (Component)
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
const [isConnecting, setIsConnecting] = useState(false);
```

## Component Architecture

### 1. Component Composition Pattern

#### Decision: Compound components with clear separation

#### Rationale:
- **Reusability**: Components can be used independently
- **Maintainability**: Clear boundaries and responsibilities
- **Testing**: Easier to test individual components
- **Scalability**: Easy to extend with new features

#### Structure:
```typescript
WalletConnector
├── ConnectButton (when disconnected)
├── WalletModal (selection interface)
├── ConnectedButton (when connected)
└── AccountDropdown (account management)
```

### 2. Hook Composition

#### Decision: Custom hooks for complex logic

#### Rationale:
- **Separation**: Logic separated from presentation
- **Reusability**: Hooks can be shared across components
- **Testing**: Easier to test business logic
- **Clarity**: Components focus on rendering

#### Example:
```typescript
// Custom hook for wallet connection logic
const useWalletConnection = () => {
  const typinkHooks = useTypink();
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Connection logic here
  
  return { ...typinkHooks, isConnecting, handleConnect };
};
```

## Error Handling Strategy

### 1. Defensive Programming Approach

#### Decision: Multiple layers of error handling

#### Rationale:
- **User Experience**: Graceful degradation when things fail
- **Debugging**: Clear error messages and logging
- **Resilience**: Application continues working despite errors
- **Development**: Easier to identify and fix issues

#### Implementation:
```typescript
// 1. Try-catch for async operations
try {
  await connectWallet(walletId);
} catch (err) {
  console.error('Failed to connect wallet:', err);
  setIsConnecting(false);
}

// 2. Optional chaining for data access
{connectedAccount?.name || 'Unknown'}

// 3. Fallback values
{balance || '0'} {network?.symbol || 'TOKEN'}

// 4. Type assertions for external data
metadata: oracleMetadata as any
```

### 2. Development vs Production Error Handling

#### Decision: Different error strategies by environment

#### Rationale:
- **Development**: Verbose logging and debug panels
- **Production**: User-friendly messages and error reporting
- **Debugging**: Rich information for developers
- **Security**: No sensitive information exposed in production

#### Implementation:
```typescript
// Development debug panel
{process.env.NODE_ENV === 'development' && (
  <div className="debug-panel">
    <div>Signer: {signer ? '✅' : '❌'}</div>
    <div>Account: {connectedAccount ? '✅' : '❌'}</div>
  </div>
)}

// Console logging with context
console.log('Wallet Connector State:', {
  signer: !!signer,
  connectedAccount: !!connectedAccount,
  isConnecting,
});
```

## Performance Considerations

### 1. React Rendering Optimization

#### Decision: Careful state management to avoid unnecessary renders

#### Rationale:
- **Performance**: Wallet components update frequently
- **User Experience**: Smooth animations and interactions
- **Resource Usage**: Efficient memory and CPU usage

#### Techniques:
```typescript
// 1. Memoized computations
const addresses = useMemo(() => 
  accounts?.map(account => account.address) || [], 
  [accounts]
);

// 2. Conditional hook calls
const balances = useBalances(addresses);

// 3. Local state for UI-only changes
const [isDropdownOpen, setIsDropdownOpen] = useState(false);

// 4. Debounced effects
useEffect(() => {
  if (signer && connectedAccount && isConnecting) {
    setJustConnected(true);
    const timeout = setTimeout(() => setJustConnected(false), 3000);
    return () => clearTimeout(timeout);
  }
}, [signer, connectedAccount, isConnecting]);
```

### 2. Bundle Size Optimization

#### Decision: Careful dependency management and code splitting

#### Rationale:
- **Loading Speed**: Faster initial page load
- **User Experience**: Responsive application startup
- **Mobile Performance**: Efficient on slower connections

#### Strategies:
```typescript
// 1. Dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />
});

// 2. Tree-shaking friendly imports
import { CheckCircle, Wallet } from 'lucide-react';

// 3. Minimal external dependencies
// Only essential packages: typink, dedot, lucide-react
```

## Security Considerations

### 1. Environment Variable Management

#### Decision: Separate public and private environment variables

#### Rationale:
- **Security**: No sensitive data in client-side code
- **Flexibility**: Different configs for different environments
- **Best Practices**: Following Next.js conventions

#### Implementation:
```typescript
// Public variables (safe for client-side)
NEXT_PUBLIC_ORACLE_ADDRESS=contract_address_here
NEXT_PUBLIC_REGISTRY_ADDRESS=contract_address_here

// Usage with fallbacks
address: process.env.NEXT_PUBLIC_ORACLE_ADDRESS || 'placeholder'
```

### 2. Type Safety as Security

#### Decision: Strict TypeScript configuration

#### Rationale:
- **Runtime Safety**: Catch errors at compile time
- **Contract Safety**: Type-safe contract interactions
- **Data Validation**: Proper typing prevents data corruption

#### Configuration:
```typescript
// tsconfig.json strict settings
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true
}

// Type-safe contract calls
const { contract: oracleContract } = useContract<OracleContractApi>(ContractId.ORACLE);
```

## Styling and Design Decisions

### 1. Tailwind CSS vs Styled Components

#### Decision: Tailwind CSS with component classes

#### Rationale:
- **Consistency**: Design system through utility classes
- **Performance**: No runtime CSS-in-JS overhead
- **Developer Experience**: Rapid prototyping and iteration
- **Maintenance**: Centralized design tokens

#### Implementation:
```css
@layer components {
  .btn-primary {
    @apply bg-primary text-white font-semibold py-2 px-4 rounded-lg 
           hover:bg-primary-600 focus:outline-none focus:ring-2 
           focus:ring-primary-500 transition-all duration-200;
  }
  
  .card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg 
           border border-gray-200 dark:border-gray-700 p-6;
  }
}
```

### 2. Dark Mode Strategy

#### Decision: CSS variables with Tailwind dark mode

#### Rationale:
- **User Preference**: Respect system/user preferences
- **Accessibility**: Better for different lighting conditions
- **Modern UX**: Expected feature in Web3 applications

#### Implementation:
```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

## Data Flow Architecture

### 1. Unidirectional Data Flow

#### Decision: Props down, events up pattern

#### Rationale:
- **Predictability**: Clear data flow direction
- **Debugging**: Easier to trace state changes
- **Testing**: Deterministic component behavior

#### Pattern:
```typescript
MainProvider (Typink State)
    ↓ props
AppProvider (Contract Context)  
    ↓ props
WalletConnector
    ↓ props         ↑ events
WalletModal    →    handleConnect()
```

### 2. Event-Driven Updates

#### Decision: useEffect for side effects and state synchronization

#### Rationale:
- **Reactivity**: Automatic updates when dependencies change
- **Separation**: Side effects separated from rendering
- **Cleanup**: Proper resource management

#### Examples:
```typescript
// Auto-select account when available
useEffect(() => {
  if (accounts && accounts.length > 0 && !connectedAccount) {
    setConnectedAccount(accounts[0]);
  }
}, [accounts, connectedAccount]);

// Connection success feedback
useEffect(() => {
  if (signer && connectedAccount && isConnecting) {
    setJustConnected(true);
    setIsConnecting(false);
  }
}, [signer, connectedAccount, isConnecting]);
```

## Testing Strategy (Future Implementation)

### 1. Testing Pyramid Approach

#### Decision: Unit tests → Integration tests → E2E tests

#### Rationale:
- **Coverage**: Different types of tests catch different issues
- **Speed**: Fast feedback loop with unit tests
- **Confidence**: E2E tests for critical user flows

#### Planned Structure:
```typescript
// Unit tests
- useTypink hook behavior
- Component rendering logic
- Utility functions

// Integration tests  
- Wallet connection flow
- Contract interaction
- State management

// E2E tests
- Complete user journeys
- Cross-browser compatibility
- Network switching
```

### 2. Mock Strategy

#### Decision: Mock external dependencies (wallet extensions, RPC)

#### Rationale:
- **Reliability**: Tests don't depend on external services
- **Speed**: Fast test execution
- **Control**: Predictable test scenarios

## Future Architecture Considerations

### 1. Scalability Preparations

#### Areas for Enhancement:
- **State Management**: Consider Zustand/Redux for complex state
- **Code Splitting**: Route-based and component-based splitting  
- **Caching**: React Query for server state management
- **Performance**: Virtual scrolling for large data sets

### 2. Extensibility Design

#### Plugin Architecture:
- **Wallet Connectors**: Easy addition of new wallets
- **Network Support**: Simple network addition process
- **Contract Types**: Automated type generation pipeline
- **UI Themes**: Customizable design system

## Lessons Learned

### 1. Documentation First Approach

**Insight**: Always check official documentation and examples before implementing

**Application**: 
- Saved hours by following Typink official examples
- TypeScript errors resolved by checking API documentation
- Network configuration issues solved by reading setup guides

### 2. Iterative Problem Solving

**Insight**: Break complex problems into smaller, debuggable pieces

**Application**:
- Started with basic TypinkProvider setup
- Added wallet connection step by step
- Implemented debugging tools to understand state flow
- Built UI components incrementally

### 3. Community Resources

**Insight**: Leverage community examples and discussions

**Application**:
- GitHub examples provided working patterns
- Discord/forum discussions revealed common issues
- Official tutorials showed best practices

## Decision Review Process

### Criteria for Technology Choices:
1. **Official Support**: Recommended by framework/library maintainers
2. **Type Safety**: Strong TypeScript integration
3. **Developer Experience**: Good tooling and documentation
4. **Community**: Active development and support
5. **Future Proof**: Aligned with ecosystem direction
6. **Performance**: Meets application requirements
7. **Maintainability**: Clear patterns and structure

### Regular Review Points:
- After major feature implementation
- When encountering significant issues
- Before adding new dependencies
- During performance optimization phases