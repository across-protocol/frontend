import { writeFileSync } from "fs";
import { join } from "path";
import axios from "axios";
import * as prettier from "prettier";
import { TOKEN_SYMBOLS_MAP, CHAIN_IDs } from "../api/_constants";

// Get API key from environment variable
const COINGECKO_PRO_API_KEY = process.env.REACT_APP_COINGECKO_PRO_API_KEY;
const COINGECKO_API_BASE = "https://pro-api.coingecko.com/api/v3";

const COINGECKO_PLATFORM_MAP: Record<number, string> = {
  [CHAIN_IDs.MAINNET]: "ethereum",
  [CHAIN_IDs.OPTIMISM]: "optimistic-ethereum",
  [CHAIN_IDs.ARBITRUM]: "arbitrum-one",
  [CHAIN_IDs.POLYGON]: "polygon-pos",
  [CHAIN_IDs.BSC]: "binance-smart-chain",
  [CHAIN_IDs.BASE]: "base",
  [CHAIN_IDs.BOBA]: "boba",
  [CHAIN_IDs.ZK_SYNC]: "zksync",
  [CHAIN_IDs.LINEA]: "linea",
  [CHAIN_IDs.SOLANA]: "solana",
};

// Rate limiting state
let currentDelay = 200; // Start with 200ms delay
const MAX_DELAY = 10000; // Maximum delay of 10 seconds
const DELAY_MULTIPLIER = 2; // Double the delay on 429

interface CoinGeckoCoinData {
  id: string;
  symbol: string;
  name: string;
  image: {
    thumb: string;
    small: string;
    large: string;
  };
}

/**
 * Fetches token metadata from CoinGecko by coin ID
 */
async function fetchTokenByCoinId(
  coinId: string
): Promise<CoinGeckoCoinData | null> {
  try {
    const params: Record<string, any> = {
      localization: false,
      tickers: false,
      market_data: false,
      community_data: false,
      developer_data: false,
      sparkline: false,
    };

    if (!COINGECKO_PRO_API_KEY) {
      throw new Error("CoinGecko Pro API key is not set.");
    }

    params.x_cg_pro_api_key = COINGECKO_PRO_API_KEY;

    const response = await axios.get<CoinGeckoCoinData>(
      `${COINGECKO_API_BASE}/coins/${coinId}`,
      { params }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 429) {
        // Rate limited - increase delay
        currentDelay = Math.min(currentDelay * DELAY_MULTIPLIER, MAX_DELAY);
        console.warn(
          `Rate limited (429) for ${coinId}. Increasing delay to ${currentDelay}ms. Retrying...`
        );
        // Wait with the new delay and retry once
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        return fetchTokenByCoinId(coinId);
      }
      console.warn(
        `Failed to fetch ${coinId}: ${status} ${error.response?.statusText}`
      );
    } else {
      console.warn(`Failed to fetch ${coinId}:`, error);
    }
    return null;
  }
}

/**
 * Fetches token metadata from CoinGecko by contract address and platform
 */
async function fetchTokenByAddress(
  address: string,
  platform: string
): Promise<CoinGeckoCoinData | null> {
  try {
    const params: Record<string, any> = {
      localization: false,
      tickers: false,
      market_data: false,
      community_data: false,
      developer_data: false,
      sparkline: false,
    };

    // Add API key to params if using Pro API
    if (COINGECKO_PRO_API_KEY) {
      params.x_cg_pro_api_key = COINGECKO_PRO_API_KEY;
    }

    const response = await axios.get<CoinGeckoCoinData>(
      `${COINGECKO_API_BASE}/coins/${platform}/${address.toLowerCase()}`,
      { params }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 429) {
        // Rate limited - increase delay
        currentDelay = Math.min(currentDelay * DELAY_MULTIPLIER, MAX_DELAY);
        console.warn(
          `Rate limited (429) for ${address} on ${platform}. Increasing delay to ${currentDelay}ms. Retrying...`
        );
        // Wait with the new delay and retry once
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        return fetchTokenByAddress(address, platform);
      }
      console.warn(
        `Failed to fetch ${address} on ${platform}: ${status} ${error.response?.statusText}`
      );
    } else {
      console.warn(`Failed to fetch ${address} on ${platform}:`, error);
    }
    return null;
  }
}

/**
 * Gets the logo URL for a token from CoinGecko
 */
async function getTokenLogoUrl(
  tokenSymbol: string,
  tokenInfo: (typeof TOKEN_SYMBOLS_MAP)[keyof typeof TOKEN_SYMBOLS_MAP]
): Promise<string | null> {
  // First, try using coingeckoId if available
  const coingeckoId = (tokenInfo as any).coingeckoId;
  if (coingeckoId && typeof coingeckoId === "string") {
    const coinData = await fetchTokenByCoinId(coingeckoId);
    if (coinData?.image?.large) {
      return coinData.image.large;
    }
  }

  // Fallback: try to find by mainnet address
  const mainnetAddress = tokenInfo.addresses[CHAIN_IDs.MAINNET];
  if (mainnetAddress && COINGECKO_PLATFORM_MAP[CHAIN_IDs.MAINNET]) {
    const platform = COINGECKO_PLATFORM_MAP[CHAIN_IDs.MAINNET];
    const coinData = await fetchTokenByAddress(mainnetAddress, platform);
    if (coinData?.image?.large) {
      return coinData.image.large;
    }
  }

  // Try other chains if mainnet doesn't work
  for (const [chainId, address] of Object.entries(tokenInfo.addresses)) {
    const chainIdNum = Number(chainId);
    if (chainIdNum === CHAIN_IDs.MAINNET) continue; // Already tried

    const platform = COINGECKO_PLATFORM_MAP[chainIdNum];
    if (platform && address) {
      const coinData = await fetchTokenByAddress(address, platform);
      if (coinData?.image?.large) {
        return coinData.image.large;
      }
    }
  }

  return null;
}

async function main() {
  try {
    console.log(`Fetching token logos from CoinGecko (Pro API)...`);
    const logoUrls: Record<string, string> = {};
    const tokens = Object.entries(TOKEN_SYMBOLS_MAP);
    const total = tokens.length;

    // Reset delay at start
    currentDelay = 200;

    for (let i = 0; i < tokens.length; i++) {
      const [symbol, tokenInfo] = tokens[i];
      console.log(`[${i + 1}/${total}] Fetching logo for ${symbol}...`);

      const logoUrl = await getTokenLogoUrl(symbol, tokenInfo);
      if (logoUrl) {
        logoUrls[symbol] = logoUrl;
        console.log(`  ✓ Found logo: ${logoUrl}`);
      } else {
        console.warn(`  ✗ No logo found for ${symbol}`);
      }

      // Add delay to avoid rate limiting (use current delay which may have increased)
      if (i < tokens.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
      }
    }

    // Generate TypeScript file content
    const fileContent = `// This file is auto-generated by scripts/generate-token-logo-urls.ts
// Do not edit manually. Run 'yarn generate:token-logos' to update.

export const TOKEN_LOGO_URLS: Record<string, string> = ${JSON.stringify(logoUrls, null, 2)};
`;

    // Format with prettier
    const formattedContent = await prettier.format(fileContent, {
      parser: "typescript",
    });

    // Write to file
    const targetFile = join(
      process.cwd(),
      "api",
      "swap",
      "tokens",
      "_logo-urls.ts"
    );
    writeFileSync(targetFile, formattedContent, "utf-8");

    const foundCount = Object.keys(logoUrls).length;
    console.log(
      `\n✅ Successfully generated logo URLs for ${foundCount}/${total} tokens`
    );
    console.log(`📄 File written to: ${targetFile}`);
  } catch (error) {
    console.error("❌ Failed to generate token logos:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
