import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import type { H160 } from 'dedot/codecs';

export function convertSS58ToH160(address: string): string {
  try {
    if (address.startsWith('0x') && address.length === 42) {
      return address.toLowerCase();
    }
    const decoded = decodeAddress(address);
    const h160Bytes = decoded.slice(0, 20);
    return (
      '0x' +
      Array.from(h160Bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    );
  } catch {
    return address;
  }
}

export function h160ToFallbackSs58(h160: H160 | string, ss58Format = 42): string {
  const clean = h160.replace(/^0x/, '');

  if (!/^[0-9a-fA-F]{40}$/.test(clean)) {
    throw new Error('Expected 20-byte H160 hex address');
  }

  const accountId = new Uint8Array(32);

  for (let index = 0; index < 20; index += 1) {
    accountId[index] = Number.parseInt(clean.slice(index * 2, index * 2 + 2), 16);
  }

  accountId.fill(0xee, 20);

  return encodeAddress(accountId, ss58Format);
}
