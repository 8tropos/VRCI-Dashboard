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
  source: 'coinmarketcap' | 'cryptorates' | 'cryptoprices' | 'coingecko' | 'binance' | 'cryptoratesai';
}

/**
 * Fetch token data from cryptorates.ai (for ATH/ATL and fallback data)
 * This matches the Google Apps Script implementation
 */
export async function fetchFromCryptoRatesAI(): Promise<Record<string, {
  price?: number;
  marketcap?: number;
  supply?: number;
  volume24h?: number;
  change24h?: number;
  change7d?: number;
  ath?: number;
  atl?: number;
}>> {
  try {
    const url = 'https://cryptorates.ai/v1/coins/all';
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CryptoRatesAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Map response to object keyed by symbol (matching Google Apps Script logic)
    const result: Record<string, any> = {};
    if (Array.isArray(data)) {
      data.forEach((coin: any) => {
        if (coin.symbol) {
          result[coin.symbol.toUpperCase()] = {
            price: coin.price,
            marketcap: coin.marketcap,
            supply: coin.supply,
            volume24h: coin.volume24h,
            change24h: coin.change24h,
            change7d: coin.change7d,
            ath: coin.ath,
            atl: coin.atl,
          };
        }
      });
    }

    return result;
  } catch (error) {
    console.error('CryptoRatesAI fetch error:', error);
    throw error;
  }
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
    // Match the Google Apps Script URL parameters
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbolString}&convert=USD&aux=circulating_supply,total_supply,max_supply,market_cap_by_total_supply,volume_30d,volume_7d`;

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

    // Fetch cryptorates.ai data for ATH/ATL (matching Google Apps Script)
    let cryptoRatesAIData: Record<string, any> = {};
    try {
      cryptoRatesAIData = await fetchFromCryptoRatesAI();
    } catch (error) {
      console.error('Failed to fetch CryptoRatesAI data:', error);
    }

    for (const symbol of symbols) {
      const symbolUpper = symbol.toUpperCase();
      const quote = data.data[symbolUpper];

      if (!quote) {
        continue;
      }

      // Handle both array and object responses
      // CoinMarketCap returns as object for single symbol, array for multiple
      const quoteData = Array.isArray(quote) ? quote[0] : quote;

      if (!quoteData || typeof quoteData !== 'object') {
        continue;
      }

      const usdQuote = quoteData.quote?.USD;
      if (!usdQuote || typeof usdQuote !== 'object') {
        continue;
      }

      // Get ATH/ATL from cryptorates.ai (matching Google Apps Script logic)
      const cryptoRatesAI = cryptoRatesAIData[symbolUpper] || {};

      result[symbolUpper] = {
        symbol: symbolUpper,
        price: usdQuote.price || cryptoRatesAI.price || 0,
        marketCap: usdQuote.market_cap || cryptoRatesAI.marketcap || null,
        volume24h: usdQuote.volume_24h || cryptoRatesAI.volume24h || null,
        ath: cryptoRatesAI.ath || null, // Get ATH from cryptorates.ai (matching script)
        atl: cryptoRatesAI.atl || null, // Get ATL from cryptorates.ai (matching script)
        supply: quoteData.circulating_supply || cryptoRatesAI.supply || null,
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

    // Use the /coins/{id} endpoint to get ATH/ATL data
    // Fetch each coin individually to get full market data including ATH/ATL
    for (const id of ids) {
      try {
        const url = `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`;

        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        const marketData = data.market_data;

        if (!marketData) {
          continue;
        }

        // Find the symbol for this ID
        const symbol = Object.entries(symbolToId).find(([_, coinId]) => coinId === id)?.[0];
        if (!symbol) {
          continue;
        }

        const price = marketData.current_price?.usd;
        if (!price || typeof price !== 'number') {
          continue;
        }

        result[symbol] = {
          symbol,
          price,
          marketCap: marketData.market_cap?.usd || null,
          volume24h: marketData.total_volume?.usd || null,
          ath: marketData.ath?.usd || null,
          atl: marketData.atl?.usd || null,
          supply: marketData.circulating_supply || marketData.total_supply || null,
          source: 'coingecko',
        };
      } catch (error) {
        console.error(`Error fetching ${id} from CoinGecko:`, error);
        continue;
      }
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
 * Matches the Google Apps Script logic:
 * 1. CoinMarketCap (with cryptorates.ai for ATH/ATL)
 * 2. CoinGecko (fallback)
 * 3. Binance (fallback)
 */
export async function fetchOracleData(
  symbols: string[],
  cmcApiKey?: string
): Promise<Record<string, OracleTokenData>> {
  const uniqueSymbols = [...new Set(symbols.map((s) => s.toUpperCase()))];
  let result: Record<string, OracleTokenData> = {};

  // Try CoinMarketCap first (if API key is available)
  // This will also fetch ATH/ATL from cryptorates.ai (matching Google Apps Script)
  if (cmcApiKey) {
    try {
      const cmcData = await fetchFromCoinMarketCap(uniqueSymbols, cmcApiKey);
      result = { ...result, ...cmcData };
    } catch (error) {
      console.error('CoinMarketCap fetch failed, trying fallbacks:', error);
    }
  }

  // Try CoinGecko for missing symbols
  const stillMissingAfterCmc = uniqueSymbols.filter((s) => !result[s]);
  if (stillMissingAfterCmc.length > 0) {
    try {
      const coingeckoData = await fetchFromCoinGecko(stillMissingAfterCmc);
      result = { ...result, ...coingeckoData };
    } catch (error) {
      console.error('CoinGecko fetch failed:', error);
    }
  }

  // Try Binance for remaining missing symbols (free, no API key)
  const stillMissingForBinance = uniqueSymbols.filter((s) => !result[s]);
  if (stillMissingForBinance.length > 0) {
    try {
      const binanceData = await fetchFromBinance(stillMissingForBinance);
      result = { ...result, ...binanceData };
    } catch (error) {
      console.error('Binance fetch failed:', error);
    }
  }

  return result;
}
