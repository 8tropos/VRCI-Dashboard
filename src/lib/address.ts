import { decodeAddress } from '@polkadot/util-crypto';

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
