/**
 * Oracle data fetchers from various sources
 */

export interface OracleTokenData {
  symbol: string;
  price: number;
  marketCap: number | null;
  volume24h: number | null;
  ath: number | null;
  atl: number | null;
  supply: number | null;
  source: 'coinmarketcap' | 'cryptorates' | 'cryptoprices' | 'coingecko' | 'binance';
}

/**
 * Fetch token data from CoinMarketCap
 */
export async function fetchFromCoinMarketCap(
  symbols: string[],
  apiKey: string
): Promise<Record<string, OracleTokenData>> {
  try {
    const symbolString = symbols.join(',');
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbolString}`;

    const response = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CoinMarketCap API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    // Check for API errors
    if (data.status?.error_code && data.status.error_code !== 0) {
      throw new Error(`CoinMarketCap API error: ${data.status.error_message || 'Unknown error'}`);
    }

    const result: Record<string, OracleTokenData> = {};

    // CoinMarketCap returns data as an object with symbol keys
    if (!data.data) {
      return result;
    }

    for (const symbol of symbols) {
      const symbolUpper = symbol.toUpperCase();
      const quote = data.data[symbolUpper];

      // Handle both array and object responses
      const quoteData = Array.isArray(quote) ? quote[0] : quote;

      if (!quoteData) {
        continue;
      }

      const usdQuote = quoteData.quote?.USD;
      if (!usdQuote) {
        continue;
      }

      result[symbolUpper] = {
        symbol: symbolUpper,
        price: usdQuote.price || 0,
        marketCap: usdQuote.market_cap || null,
        volume24h: usdQuote.volume_24h || null,
        ath: usdQuote.ath_price || null,
        atl: usdQuote.atl_price || null,
        supply: quoteData.total_supply || quoteData.circulating_supply || null,
        source: 'coinmarketcap',
      };
    }

    return result;
  } catch (error) {
    console.error('CoinMarketCap fetch error:', error);
    throw error;
  }
}

/**
 * Fetch token data from CoinGecko (fallback - free, no API key required)
 */
export async function fetchFromCoinGecko(
  symbols: string[]
): Promise<Record<string, OracleTokenData>> {
  try {
    const result: Record<string, OracleTokenData> = {};

    // CoinGecko uses coin IDs, so we need a mapping
    const symbolToId: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'DOT': 'polkadot',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'BNB': 'binancecoin',
      'SOL': 'solana',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'AVAX': 'avalanche-2',
      'MATIC': 'matic-network',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'ATOM': 'cosmos',
      'ALGO': 'algorand',
    };

    // Get IDs for symbols we can map
    const ids = symbols
      .map(s => symbolToId[s.toUpperCase()])
      .filter(Boolean);

    if (ids.length === 0) {
      return result;
    }

    const idsString = ids.join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=false&include_last_updated_at=true`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    // Create reverse mapping
    const idToSymbol: Record<string, string> = {};
    for (const [symbol, id] of Object.entries(symbolToId)) {
      idToSymbol[id] = symbol;
    }

    // Process each coin
    for (const [id, priceData] of Object.entries(data)) {
      const symbol = idToSymbol[id];
      if (!symbol || !priceData || typeof priceData !== 'object') {
        continue;
      }

      const price = (priceData as any).usd;
      if (!price || typeof price !== 'number') {
        continue;
      }

      result[symbol] = {
        symbol,
        price,
        marketCap: (priceData as any).usd_market_cap || null,
        volume24h: (priceData as any).usd_24h_vol || null,
        ath: null, // CoinGecko free API doesn't include ATH/ATL
        atl: null,
        supply: null,
        source: 'cryptorates', // Keep same source name for compatibility
      };
    }

    return result;
  } catch (error) {
    console.error('CoinGecko fetch error:', error);
    throw error;
  }
}

/**
 * Fetch token data from Binance API (fallback - free, no API key required)
 */
export async function fetchFromBinance(
  symbols: string[]
): Promise<Record<string, OracleTokenData>> {
  try {
    const result: Record<string, OracleTokenData> = {};

    // Binance uses trading pairs like BTCUSDT
    for (const symbol of symbols) {
      try {
        const symbolUpper = symbol.toUpperCase();
        const tradingPair = `${symbolUpper}USDT`;
        
        const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${tradingPair}`;
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();

        if (!data || !data.lastPrice) {
          continue;
        }

        const price = parseFloat(data.lastPrice);
        if (isNaN(price) || price <= 0) {
          continue;
        }

        result[symbolUpper] = {
          symbol: symbolUpper,
          price,
          marketCap: null, // Binance doesn't provide market cap
          volume24h: data.quoteVolume ? parseFloat(data.quoteVolume) : null,
          ath: null, // Binance 24hr ticker doesn't include ATH/ATL
          atl: null,
          supply: null,
          source: 'cryptoprices', // Keep same source name for compatibility
        };
      } catch (error) {
        console.error(`Error fetching ${symbol} from Binance:`, error);
        continue;
      }
    }

    return result;
  } catch (error) {
    console.error('Binance fetch error:', error);
    throw error;
  }
}

/**
 * Fetch token data with fallback chain
 * Tries CoinMarketCap first (if API key available), then CoinGecko, then Binance
 */
export async function fetchOracleData(
  symbols: string[],
  cmcApiKey?: string
): Promise<Record<string, OracleTokenData>> {
  const uniqueSymbols = [...new Set(symbols.map((s) => s.toUpperCase()))];
  let result: Record<string, OracleTokenData> = {};

  // Try CoinMarketCap first (if API key is available)
  if (cmcApiKey) {
    try {
      const cmcData = await fetchFromCoinMarketCap(uniqueSymbols, cmcApiKey);
      result = { ...result, ...cmcData };

      // If we got all symbols, return early
      const missingSymbols = uniqueSymbols.filter((s) => !result[s]);
      if (missingSymbols.length === 0) {
        return result;
      }
    } catch (error) {
      console.error('CoinMarketCap fetch failed, trying fallbacks:', error);
    }
  }

  // Try CoinGecko for missing symbols (free, no API key)
  const missingFromCmc = uniqueSymbols.filter((s) => !result[s]);
  if (missingFromCmc.length > 0) {
    try {
      const coingeckoData = await fetchFromCoinGecko(missingFromCmc);
      result = { ...result, ...coingeckoData };
    } catch (error) {
      console.error('CoinGecko fetch failed:', error);
    }
  }

  // Try Binance for remaining missing symbols (free, no API key)
  const stillMissing = uniqueSymbols.filter((s) => !result[s]);
  if (stillMissing.length > 0) {
    try {
      const binanceData = await fetchFromBinance(stillMissing);
      result = { ...result, ...binanceData };
    } catch (error) {
      console.error('Binance fetch failed:', error);
    }
  }

  return result;
}

