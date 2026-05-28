'use client';

import { useState } from 'react';
import { useContract, useContractQuery } from 'typink';
import type { AccountId32Like } from 'dedot/codecs';
import { decodeAddress, encodeAddress } from 'dedot/utils';
import type { OracleContractApi } from '@/lib/contracts/oracle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info, Copy } from 'lucide-react';
import { LabelWithHelp } from '../ui/field-help';

const H160_HEX_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const ACCOUNT_ID32_HEX_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const ZERO_PADDED_H160_PATTERN = /^0x0{24}[0-9a-fA-F]{40}$/;
const ACCOUNT_ID32_H160_PREFIX = '0x000000000000000000000000';

type DotTokenCheckResult = {
  isDotToken: boolean;
  tokenAddress: string;
};

const isUint8Array = (value: unknown): value is Uint8Array => value instanceof Uint8Array;

const bytesToHex = (bytes: Uint8Array): `0x${string}` => {
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
};

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'Unknown error occurred';
};

const formatAddressString = (value: string): string => {
  const address = value.trim();

  if (H160_HEX_PATTERN.test(address)) {
    return address;
  }

  if (ZERO_PADDED_H160_PATTERN.test(address)) {
    return `0x${address.slice(-40)}`;
  }

  if (ACCOUNT_ID32_HEX_PATTERN.test(address)) {
    try {
      return encodeAddress(address);
    } catch {
      return address;
    }
  }

  return address;
};

const getRawAddress = (address: unknown): string | null => {
  if (!address || typeof address !== 'object' || !('raw' in address)) {
    return null;
  }

  const raw = (address as { raw?: unknown }).raw;

  if (typeof raw === 'string') {
    return raw;
  }

  if (isUint8Array(raw)) {
    return bytesToHex(raw);
  }

  return null;
};

const formatOracleTokenAddress = (address: unknown): string => {
  if (!address) return '';

  if (typeof address === 'string') {
    return formatAddressString(address);
  }

  const rawAddress = getRawAddress(address);
  if (rawAddress) {
    return formatAddressString(rawAddress);
  }

  if (typeof (address as { address?: unknown }).address === 'function') {
    try {
      return (address as { address: () => string }).address();
    } catch {
      return '';
    }
  }

  if (typeof (address as { toString?: unknown }).toString === 'function') {
    const value = (address as { toString: () => string }).toString();
    return value === '[object Object]' ? '' : value;
  }

  return '';
};

const toOracleTokenArg = (value: string): AccountId32Like | null => {
  const address = value.trim();

  if (!address) {
    return null;
  }

  if (H160_HEX_PATTERN.test(address)) {
    return `${ACCOUNT_ID32_H160_PREFIX}${address.slice(2)}` as AccountId32Like;
  }

  if (ACCOUNT_ID32_HEX_PATTERN.test(address)) {
    return address as AccountId32Like;
  }

  if (address.startsWith('0x')) {
    return null;
  }

  try {
    return decodeAddress(address).length === 32 ? address : null;
  } catch {
    return null;
  }
};

export default function OracleDotTokenManager() {
  const { contract: oracleContract } = useContract<OracleContractApi>('oracle');
  const [tokenAddress, setTokenAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DotTokenCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Query hooks
  const { data: dotTokenAddress, isLoading: isLoadingAddress } = useContractQuery({
    contract: oracleContract,
    fn: 'getDotTokenAddress',
  });

  const handleCheckDotToken = async () => {
    const tokenArg = toOracleTokenArg(tokenAddress);

    if (!tokenArg) {
      setError('Please enter a valid H160, 32-byte raw hex, or SS58 token address');
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!oracleContract) {
        setError('Contract not available');
        return;
      }
      const response = await oracleContract.query.isDotToken(tokenArg);
      setResult({
        isDotToken: response.data === true,
        tokenAddress: formatOracleTokenAddress(tokenArg),
      });
    } catch (err) {
      setError(`Error checking DOT token: ${getErrorMessage(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formattedDotTokenAddress = formatOracleTokenAddress(dotTokenAddress);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            DOT Token Management
          </CardTitle>
          <CardDescription>
            Manage and verify DOT token configuration for USD price feeds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current DOT Token Address */}
          <div className="space-y-2">
            <Label>Current DOT Token Address</Label>
            <div className="flex items-center gap-2">
              <Input
                value={formattedDotTokenAddress}
                readOnly
                className="font-mono text-sm"
                placeholder="Loading..."
              />
              {formattedDotTokenAddress && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => navigator.clipboard.writeText(formattedDotTokenAddress)}
                  className="h-8 w-8"
                  aria-label="Copy DOT token address"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              {isLoadingAddress ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : dotTokenAddress ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>

          {/* Check if Token is DOT Token */}
          <div className="space-y-2">
            <LabelWithHelp
              htmlFor="dot-token-check"
              helpText="Enter a token contract address as H160 (0x...), 32-byte raw hex, or SS58 to check if it is the DOT token configured in the oracle. H160 inputs are converted to the AccountId-compatible format expected by the contract query. This is a read-only query that doesn't require a transaction."
            >
              Check if Token is DOT Token
            </LabelWithHelp>
            <div className="flex gap-2">
              <Input
                id="dot-token-check"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="Enter H160, 32-byte hex, or SS58 address"
                className="font-mono text-sm"
              />
              <Button
                onClick={handleCheckDotToken}
                disabled={!tokenAddress || isLoading}
                variant="outline"
              >
                {isLoading ? 'Checking...' : 'Check'}
              </Button>
            </div>
          </div>

          {/* Results */}
          {result && (
            <Alert className={result.isDotToken ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className="flex items-center gap-2">
                {result.isDotToken ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>
                  Token {result.tokenAddress} is {result.isDotToken ? '' : 'not '}the DOT token
                </span>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Information */}
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>DOT Token:</strong> The token used for USD price feeds in registry tier calculations</p>
            <p><strong>Purpose:</strong> Enables automatic tier updates based on market conditions</p>
            <p><strong>Integration:</strong> Connected to Registry contract for real-time tier management</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
