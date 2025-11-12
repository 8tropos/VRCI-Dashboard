import { z } from 'zod';

/**
 * Zod schemas for Oracle API validation
 */

export const oracleTokenDataSchema = z.object({
  symbol: z.string(),
  price: z.number().nonnegative(),
  marketCap: z.number().nonnegative().nullable(),
  volume24h: z.number().nonnegative().nullable(),
  ath: z.number().nonnegative().nullable(),
  atl: z.number().nonnegative().nullable(),
  supply: z.number().nonnegative().nullable(),
  source: z.enum(['coinmarketcap', 'cryptorates', 'cryptoprices', 'coingecko', 'binance']),
});

export const oracleResponseSchema = z.object({
  success: z.boolean(),
  data: z.record(z.string(), oracleTokenDataSchema).optional(),
  error: z.string().optional(),
});

export type OracleTokenData = z.infer<typeof oracleTokenDataSchema>;
export type OracleResponse = z.infer<typeof oracleResponseSchema>;

