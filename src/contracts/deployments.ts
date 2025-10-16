// Contract deployment configuration
export enum ContractId {
    ORACLE = 'oracle',
    REGISTRY = 'registry',
    TOKEN = 'token',
}

// Import your generated metadata directly
import oracleMetadata from './artifacts/oracle/oracle.json';
import registryMetadata from './artifacts/registry/registry.json';
import tokenMetadata from './artifacts/token/token.json';

export const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'wss://rpc1.paseo.popnetwork.xyz';

// Typink deployments for Pop Testnet only
export const deployments = [
    {
        id: ContractId.ORACLE,
        network: 'pop_testnet',
        address: process.env.NEXT_PUBLIC_ORACLE_ADDRESS || '5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM', // placeholder address
        metadata: oracleMetadata as any, // Use the imported metadata directly
    },
    {
      id: ContractId.REGISTRY,
      network: 'pop_testnet',
      address: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '',
      metadata: registryMetadata,
    },
    {
        id: ContractId.TOKEN,
        network: 'pop_testnet',
        address: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '',
        metadata: tokenMetadata,
    },
];