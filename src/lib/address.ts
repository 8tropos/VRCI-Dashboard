import { decodeAddress, encodeAddress, keccakAsU8a } from '@polkadot/util-crypto';
import type { H160 } from 'dedot/codecs';

const H160_HEX_PATTERN = /^0x[0-9a-fA-F]{40}$/;

function bytesToHex(bytes: Uint8Array): H160 {
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}` as H160;
}

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

export function ss58ToReviveH160(ss58: string): H160 {
  const accountId = decodeAddress(ss58);

  if (accountId.length !== 32) {
    throw new Error(`Expected AccountId32, got ${accountId.length} bytes`);
  }

  const suffix = accountId.slice(20);
  if (suffix.every((byte) => byte === 0xee)) {
    return bytesToHex(accountId.slice(0, 20));
  }

  return bytesToHex(keccakAsU8a(accountId, 256).slice(12));
}

export function encodeSs58AsFormat(ss58: string, ss58Format: number): string {
  return encodeAddress(decodeAddress(ss58), ss58Format);
}

export function isSameH160(left: H160 | string, right: H160 | string): boolean {
  if (!H160_HEX_PATTERN.test(left) || !H160_HEX_PATTERN.test(right)) {
    return false;
  }

  return left.toLowerCase() === right.toLowerCase();
}
