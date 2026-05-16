# W3PI - Web3 Portfolio Intelligence

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Polkadot](https://img.shields.io/badge/Polkadot-Pop_Testnet-E6007A?style=for-the-badge&logo=polkadot)](https://polkadot.network/)
[![ink!](https://img.shields.io/badge/ink!-5.1.1-000000?style=for-the-badge&logo=rust)](https://use.ink/)

> A decentralized portfolio management platform built with ink! smart contracts on the Polkadot ecosystem

## 🚀 Overview

**W3PI (Web3 Portfolio Intelligence)** is a sophisticated decentralized portfolio management platform that leverages the power of ink! smart contracts on the Polkadot ecosystem. Built with Next.js 15 and Typink, it provides a comprehensive interface for managing token portfolios with advanced features like real-time price feeds, tier-based classification, and cross-contract integration.

### ✨ Key Features

- 🔗 **Multi-Wallet Support** - Connect with Polkadot.js, Talisman, or SubWallet
- 📊 **Real-Time Oracle Integration** - Live price feeds and market data
- 🏷️ **Advanced Tier System** - 5-tier classification with grace periods
- 💰 **PSP22 Token Management** - Full PSP22 standard compliance
- 🎨 **Modern UI/UX** - Responsive design with dark mode support
- 🔒 **Role-Based Access Control** - Granular permission management
- 📱 **Mobile-First Design** - Optimized for all devices
- ⚡ **Type-Safe Development** - Full TypeScript coverage

## 🏗️ Architecture

### Smart Contracts

The platform consists of three core smart contracts:

1. **Oracle Contract** - Price feeds, market data validation, and emergency controls
2. **Registry Contract** - Token portfolio management with advanced tier system
3. **Token Contract** - PSP22 fungible token with role-based access control

### Technology Stack

- **Frontend**: Next.js 15 (App Router) with TypeScript
- **Web3 Integration**: Typink (by Dedot team)
- **Blockchain**: Pop Testnet (Polkadot parachain)
- **Styling**: Tailwind CSS v4 with custom design system
- **UI Components**: Radix UI primitives
- **State Management**: React Context + Typink hooks

## 🛠️ Installation

### Prerequisites

- **Node.js** v20 or higher
- **npm** or **yarn** package manager
- **Git** for cloning the repository
- **Polkadot wallet extension** (Polkadot.js, Talisman, or SubWallet)
- **PAS tokens** from [Pop Testnet faucet](https://onboard.popnetwork.xyz)

### Devcontainer

For a containerized local setup, this repo now includes a VS Code Devcontainer with:

- Node.js 20
- Bun
- PostgreSQL 16
- Prisma-ready `DATABASE_URL` wired to the local `db` service

Quick start:

1. Open the repository in VS Code.
2. Run `Dev Containers: Reopen in Container`.
3. Wait for the post-create setup to finish.
4. Run the bootstrap commands in the container terminal:

   ```bash
   npx prisma migrate deploy
   bunx prisma db seed    # optional
   npm run dev
   ```

Then open `http://localhost:3000` in your host browser. Use your normal host-installed wallet extension for Polkadot.js, Talisman, or SubWallet.

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/w3pi-web.git
   cd w3pi-web
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env.local
   ```

   Edit `.env.local` and add your contract addresses:

   ```env
   NEXT_PUBLIC_ORACLE_ADDRESS=your_oracle_contract_address
   NEXT_PUBLIC_REGISTRY_ADDRESS=your_registry_contract_address
   NEXT_PUBLIC_TOKEN_ADDRESS=your_token_contract_address
   ```

4. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Getting Started

1. **Connect Your Wallet**
   - Click "Connect Wallet" in the top navigation
   - Select your preferred wallet extension
   - Approve the connection

2. **Explore the Dashboard**
   - View network status and contract connections
   - Check your wallet balance and account information
   - Access quick actions for different contract functions

3. **Oracle Contract**
   - **Query**: Fetch live price data and market information
   - **Update**: Submit price updates (requires authorization)
   - **Advanced**: Bulk operations and data management
   - **DOT/USD**: Specialized DOT price feed management
   - **Config**: Validation settings and parameters
   - **Auth**: Manage authorized updaters
   - **Emergency**: Override controls for critical situations
   - **Info**: Contract details and status

4. **Registry Contract**
   - **Query**: View registered tokens with live oracle data
   - **Manage**: Add new tokens and update portfolio data
   - **Tiers**: Calculate and manage token tier classifications
   - **Analytics**: View tier distribution and trends
   - **Config**: Manage oracles and tier thresholds
   - **Info**: Contract details and permissions
   - **Roles**: Manage roles and permissions
   - **Grace**: Handle tier change grace periods

5. **Token Contract**
   - **Query**: Check balances, allowances, and metadata
   - **Manage**: Transfer, approve, mint, and burn tokens
   - **Roles**: Manage permissions and ownership

## 🔧 Development

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main homepage
│   ├── oracle/            # Oracle contract pages
│   ├── registry/          # Registry contract pages
│   └── token/             # Token contract pages
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (Radix UI)
│   ├── cards/            # Status and information cards
│   ├── oracle/           # Oracle-specific components
│   ├── registry/         # Registry-specific components
│   ├── token/            # Token-specific components
│   ├── providers/        # Context providers
│   └── navigation/       # Navigation components
├── contracts/            # Smart contract integration
│   ├── artifacts/        # Contract build artifacts
│   ├── types/           # Generated TypeScript types
│   └── deployments.ts   # Contract deployment configuration
├── lib/                 # Utility functions
└── utils/               # Helper utilities
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Type checking
npm run type-check       # Check TypeScript types
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_ORACLE_ADDRESS` | Oracle contract address | Yes |
| `NEXT_PUBLIC_REGISTRY_ADDRESS` | Registry contract address | Yes |
| `NEXT_PUBLIC_TOKEN_ADDRESS` | Token contract address | Yes |

## 🌐 Network Configuration

### Pop Testnet

- **Network ID**: `pop_testnet`
- **RPC Endpoint**: `wss://rpc2.paseo.popnetwork.xyz/`
- **Native Token**: PAS (Paseo tokens)
- **Decimals**: 10
- **Faucet**: [https://onboard.popnetwork.xyz](https://onboard.popnetwork.xyz)

### Why Pop Testnet?

- Polkadot parachain optimized for smart contracts
- Stable testnet environment
- Excellent developer tooling support
- Full compatibility with ink! contracts

## 📚 Documentation

For detailed documentation, visit our [docs](./docs/) directory:

- [Project Overview](./docs/project_overview.md) - Complete feature overview
- [Architecture Decisions](./docs/architecture_decisions.md) - Technical rationale
- [Setup Guide](./docs/setup_guide.md) - Detailed installation instructions
- [Challenges & Solutions](./docs/challenges_solutions.md) - Problem-solving approach
- [Future Roadmap](./docs/future_roadmap.md) - Planned enhancements

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Devcontainer Notes

- The app container injects `DATABASE_URL=postgresql://postgres:postgres@db:5432/w3pi?schema=public`.
- `.env.local` is created from `env.example` on first container build if it does not already exist.
- The Next.js dev server binds to `0.0.0.0`, so VS Code port forwarding exposes it on your host machine.
- Prisma migrations and seed commands should be run from the container terminal.

### Code Style

- Use TypeScript for all new code
- Follow the existing code style and patterns
- Add proper error handling and validation
- Include appropriate comments and documentation
- Write tests for new features

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📦 Deployment

### Vercel (CLI-driven)

1. One-time setup:
   ```bash
   bun install
   bunx vercel login
   bunx vercel link
   ```
2. Provision **Vercel Postgres (Neon)** from the Vercel dashboard (Storage → Create Database) and attach it to the project. This auto-injects `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) into all environments. For local development without pooling, `DATABASE_URL_UNPOOLED` can use the same value as `DATABASE_URL`.
3. Add the remaining env vars (see `env.example`) — at minimum `CMC_API_KEY`, `POLKADOT_RPC_URL`, and the `NEXT_PUBLIC_*` contract addresses + RPC URL:
   ```bash
   bunx vercel env add CMC_API_KEY production
   # ...repeat for each variable, or paste via the dashboard
   bun run vercel:env   # pulls them into .env.local for parity
   ```
4. Deploy:
   - Preview: `bun run deploy:preview`
   - Production: `bun run deploy`

Vercel runs `bun run vercel-build`, which executes `prisma generate && prisma migrate deploy && next build`, so pending migrations are applied automatically before the new code goes live. Local `bun run build` only generates Prisma and builds Next.js. Build/install commands and the deployment region are pinned in `vercel.json`.

### Manual Deployment

```bash
# Build the application
bun run build
# or, if Bun is not installed locally
npm run build

# Start production server
bun run start
# or
npm run start
```

## 🔒 Security

- All contract interactions are type-safe
- Environment variables are properly managed
- No sensitive data is exposed in client-side code
- Comprehensive error handling prevents data corruption
- Role-based access control for administrative functions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Typink](https://github.com/dedotdev/typink) - Web3 integration library
- [Dedot](https://github.com/dedotdev/dedot) - Polkadot client library
- [ink!](https://use.ink/) - Smart contract framework
- [Pop Network](https://popnetwork.xyz/) - Testnet infrastructure
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/w3pi-web/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/w3pi-web/discussions)
- **Email**:

## 🗺️ Roadmap

- [ ] **Analytics Dashboard** - Advanced portfolio analytics

---

<div align="center">

**Built with ❤️ for the Polkadot ecosystem**

[![Polkadot](https://img.shields.io/badge/Made_for-Polkadot-E6007A?style=for-the-badge&logo=polkadot)](https://polkadot.network/)
[![ink!](https://img.shields.io/badge/Powered_by-ink!-000000?style=for-the-badge&logo=rust)](https://use.ink/)

</div>
