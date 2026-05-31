# Contract Transaction Signing And Gas Estimation

This document summarizes how browser-side contract transactions work in this dashboard, using `src/components/oracle/oracle-authorization-manager.tsx` as the main example. It also explains how gas, weight, dry runs, storage deposits, and fee estimates relate to each other for Polkadot Hub / pallet-revive contracts.

Reference: Polkadot Developer Docs, [Gas Model on the Polkadot Hub](https://docs.polkadot.com/smart-contracts/for-eth-devs/gas-model/).

## Example Transaction

The Oracle authorization manager creates a typed Oracle contract instance:

```ts
const { contract: oracleContract } = useContract<OracleContractApi>('oracle');
```

Then it creates transaction helpers for specific contract messages:

```ts
const addUpdaterTx = useContractTx(oracleContract, 'addUpdater');
const removeUpdaterTx = useContractTx(oracleContract, 'removeUpdater');
```

When the user submits an updater address, the component calls:

```ts
await addUpdaterTx.signAndSend({
  args: [updaterAddress.trim()],
  txOptions: ORACLE_AUTH_TX_OPTIONS,
  callback: (progress) => {
    toaster.onTxProgress(progress);

    if (progress.status.type === 'BestChainBlockIncluded') {
      setUpdaterAddress('');
      void refreshConnectedAuthorization();
    }
  },
});
```

The app code gives Typink and Dedot the method name, arguments, optional transaction options, and a progress callback. It does not manually serialize the extrinsic, sign bytes, or submit raw payloads.

## Provider And Contract Setup

The contract instance comes from `src/providers/TypinkProvider.tsx`.

The provider registers:

- the network id, currently `passet_hub_testnet`
- the RPC provider list
- the Oracle deployment id, `oracle`
- the Oracle address from `NEXT_PUBLIC_ORACLE_ADDRESS_DEV` or `NEXT_PUBLIC_ORACLE_ADDRESS`
- the Oracle metadata from `src/contracts/metadata/oracle.json`

Typink uses that deployment registry when a component calls:

```ts
useContract<OracleContractApi>('oracle')
```

Internally, Typink creates a Dedot `Contract` instance using the connected Dedot client, contract metadata, contract address, and default caller.

## Generated Contract Types

Generated contract bindings live under `src/lib/contracts`.

For Oracle, `src/lib/contracts/oracle/tx.d.ts` defines `addUpdater` as a transaction method that accepts one `AccountId32Like` argument and returns a `ContractSubmittableExtrinsic`.

The generated method also includes the contract selector:

```text
0xab58e72a
```

Dedot uses the metadata, selector, arguments, contract address, and transaction options to build the contract-call extrinsic.

## What `useContractTx` Does

Typink's `useContractTx(contract, 'addUpdater')` returns:

- `signAndSend(...)`
- `inProgress`
- `inBestBlockProgress`

When `signAndSend` is called, Typink:

1. Checks that the contract exists.
2. Checks that a wallet account is connected.
3. Marks the transaction as in progress.
4. Checks that the caller has enough native token balance.
5. Runs a dry-run contract query.
6. Builds the real Dedot contract transaction.
7. Asks the connected wallet signer to sign.
8. Submits the signed extrinsic through RPC.
9. Reports progress through the callback.

The simplified internal flow is:

```ts
const dryRun = await contract.query[fn](...args, { caller });

await contract.tx[fn](...args, txOptions).signAndSend(caller, callback);
```

## Wallet Signing

The app does not hold private keys.

When a wallet is connected, Typink gets the injected signer from the browser wallet extension and gives it to the Dedot client. At signing time:

1. Dedot prepares the transaction payload for the selected account.
2. The wallet extension shows a signing prompt.
3. The user approves or rejects the prompt.
4. If approved, the wallet signs the payload.
5. Dedot submits the signed extrinsic to the configured RPC provider.

If the user rejects the prompt, `signAndSend` throws and the component's `catch` block handles the error.

## Progress Statuses

The callback receives Dedot transaction progress. The app displays these statuses through `src/utils/txToaster.tsx`.

Common statuses:

- `Validated`: the transaction is valid and ready to submit.
- `Broadcasting`: the transaction has been broadcast.
- `BestChainBlockIncluded`: the transaction was included in the current best block.
- `Finalized`: the transaction was finalized.
- `Invalid`: the transaction is invalid.
- `Drop`: the transaction was dropped.

The Oracle authorization UI refreshes on `BestChainBlockIncluded`, because that is a practical UI success point:

```ts
if (progress.status.type === 'BestChainBlockIncluded') {
  setUpdaterAddress('');
  void refreshConnectedAuthorization();
}
```

Typink's promise resolves only after a terminal status:

- `Finalized`
- `Invalid`
- `Drop`

So `BestChainBlockIncluded` is good for UI refresh, while `Finalized` is the stronger chain-confirmation milestone.

## Gas, Weight, And Storage Deposit

On Polkadot Hub / pallet-revive, gas is an Ethereum-compatible interface over Polkadot's resource model.

The important underlying resources are:

- `refTime`: computational execution time
- `proofSize`: state proof size needed for validation
- `storageDeposit`: native balance reserved when contract execution creates storage

In Dedot contract transaction options, these appear as:

```ts
type ContractTxOptions = {
  value?: bigint;
  gasLimit?: {
    refTime: bigint;
    proofSize: bigint;
  };
  storageDepositLimit?: bigint;
};
```

The current Oracle authorization component uses a hardcoded gas limit:

```ts
const ORACLE_AUTH_TX_OPTIONS: Partial<ContractTxOptions> = {
  gasLimit: {
    refTime: 100_000_000_000n,
    proofSize: 1_000_000n,
  },
};
```

This is not a fee. It is a maximum execution weight limit.

## Should We Manually Calculate `refTime` And `proofSize`?

Usually no.

The better default is to let Dedot estimate the contract resources from a dry run. If `gasLimit` is not supplied, Dedot can dry-run the contract call before signing and fill `gasLimit` from:

```ts
dryRun.raw.gasRequired
```

For revive contracts, Dedot can also fill:

```ts
storageDepositLimit = dryRun.raw.storageDeposit.value
```

So a simple transaction can often omit hardcoded gas options:

```ts
await addUpdaterTx.signAndSend({
  args: [updaterAddress.trim()],
  callback: (progress) => {
    toaster.onTxProgress(progress);
  },
});
```

Use hardcoded gas limits only when there is a specific reason, such as protecting against unexpectedly expensive execution or matching a known operational limit.

## What Dry Run Returns

A contract dry run returns both decoded contract data and raw execution information.

The useful raw fields are:

```ts
dryRun.raw.gasConsumed
dryRun.raw.gasRequired
dryRun.raw.storageDeposit
```

Meaning:

- `gasConsumed`: resources actually consumed by the simulated execution
- `gasRequired`: resources required to execute safely
- `storageDeposit`: storage balance charged or refunded by the simulated execution

Example preflight:

```ts
const dryRun = await oracleContract.query.addUpdater(updaterAddress.trim(), {
  caller: connectedAccount.address,
});

console.log(dryRun.raw.gasRequired);
console.log(dryRun.raw.storageDeposit);
```

This dry run does not change chain state.

## Gas Estimate Is Not The Same As Fee Estimate

Dry run estimates contract execution resources.

Fee estimation asks what native-token fee the chain expects for the whole extrinsic.

The distinction:

```text
dryRun.raw.gasRequired          -> contract execution resource limit
dryRun.raw.storageDeposit       -> storage deposit charge/refund information
tx.paymentInfo(...).partialFee  -> estimated native token transaction fee
```

Dedot submittable extrinsics support:

```ts
const tx = oracleContract.tx.addUpdater(updaterAddress.trim(), txOptions);
const paymentInfo = await tx.paymentInfo(connectedAccount.address);

console.log(paymentInfo.partialFee);
```

Typink exposes fee helpers for general chain transactions through `useTx` and `useTxFee`, but the installed `useContractTx` helper does not directly expose contract `paymentInfo` to the component.

## Practical Recommendation For This Project

For simple UI transactions:

- Prefer omitting hardcoded `gasLimit`.
- Let Dedot run its internal dry-run estimation.
- Keep the callback for user-facing progress.

For admin/debug flows:

- Run an explicit dry run before submitting.
- Display or log `gasRequired`, `storageDeposit`, and decoded contract errors.
- Build the transaction and call `paymentInfo(...)` if the UI needs an estimated native fee.

For current Oracle authorization code, the simpler version would be:

```ts
await addUpdaterTx.signAndSend({
  args: [updaterAddress.trim()],
  callback: (progress) => {
    toaster.onTxProgress(progress);

    if (progress.status.type === 'BestChainBlockIncluded') {
      setUpdaterAddress('');
      void refreshConnectedAuthorization();
    }
  },
});
```

If we want debug visibility, do this first:

```ts
const dryRun = await oracleContract.query.addUpdater(updaterAddress.trim(), {
  caller: connectedAccount.address,
});

console.info('addUpdater dry-run:', {
  gasConsumed: dryRun.raw.gasConsumed,
  gasRequired: dryRun.raw.gasRequired,
  storageDeposit: dryRun.raw.storageDeposit,
});
```

## End-To-End Flow

```text
User clicks Add Updater
  -> React validates input
  -> Component calls addUpdaterTx.signAndSend(...)
  -> Typink checks contract and connected account
  -> Typink checks caller balance
  -> Typink dry-runs oracle.query.addUpdater(...)
  -> Dedot builds oracle.tx.addUpdater(...)
  -> If gasLimit/storageDepositLimit are missing, Dedot can dry-run and fill them
  -> Wallet extension asks user to sign
  -> Wallet signs after approval
  -> Dedot submits signed extrinsic through RPC
  -> Callback receives status updates
  -> UI refreshes on BestChainBlockIncluded
  -> Promise resolves after Finalized, Invalid, or Drop
```

## Short Summary

The dashboard uses Typink's `useContractTx` to wrap generated Dedot contract transactions. Typink checks the connected account, performs a dry-run preflight, builds the contract extrinsic, asks the wallet to sign, submits through RPC, and reports progress through the callback. Dry runs return `gasConsumed`, `gasRequired`, and `storageDeposit`; these are execution resource estimates, not final transaction fees. For most simple calls, do not manually calculate `refTime` and `proofSize`; let Dedot estimate them. Use `paymentInfo(...)` when the UI needs the estimated native-token fee.
