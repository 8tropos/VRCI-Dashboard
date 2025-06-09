// Contract deployment configuration
export enum ContractId {
    ORACLE = 'oracle',
    REGISTRY = 'registry',
}

// Import your generated metadata directly
import oracleMetadata from './artifacts/oracle/oracle.json';
import registryMetadata from './artifacts/registry/registry.json';

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
];