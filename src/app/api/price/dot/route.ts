import { NextResponse } from 'next/server';
import { fetchOracleData } from '@/lib/api/oracle-fetchers';

/**
 * GET /api/price/dot
 * Returns the current DOT/USD price.
 * Used by the useSubscanDotPrice hook.
 * Response: { price: number }
 */
export async function GET(): Promise<NextResponse> {
  try {
    const cmcApiKey = process.env.CMC_API_KEY;
    const data = await fetchOracleData(['DOT'], cmcApiKey);
    const dot = data['DOT'];

    if (!dot || typeof dot.price !== 'number' || !Number.isFinite(dot.price)) {
      return NextResponse.json(
        { price: null, error: 'Could not fetch DOT price' },
        { status: 502 }
      );
    }

    return NextResponse.json({ price: dot.price });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET /api/price/dot error:', error);
    return NextResponse.json({ price: null, error: msg }, { status: 500 });
  }
}
