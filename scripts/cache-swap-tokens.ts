import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { fetchSwapTokensData, SwapToken } from "../api/swap/tokens/_service";
import { ENABLED_ROUTES } from "../api/_utils";

export interface SwapTokensCache {
  tokens: SwapToken[];
  timestamp: number;
  version: string;
}

async function main() {
  try {
    const chainIds = new Set(
      ENABLED_ROUTES.routes.map((route) => route.fromChain)
    );
    console.log("Fetching swap tokens data for chains:", Array.from(chainIds));
    const tokens = await fetchSwapTokensData(Array.from(chainIds));

    // Create cache directory if it doesn't exist
    const cacheDir = join(process.cwd(), "src", "data");
    mkdirSync(cacheDir, { recursive: true });

    // Write cached tokens to file
    const cacheFile = join(cacheDir, "swap-tokens.json");
    const cacheData: SwapTokensCache = {
      tokens,
      timestamp: Date.now(),
      version: "1.0.0",
    };

    writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));

    console.log(
      `✅ Successfully cached ${tokens.length} swap tokens to ${cacheFile}`
    );
    console.log(
      `📊 Cache size: ${Math.round(JSON.stringify(cacheData).length / 1024)}KB`
    );
  } catch (error) {
    console.error("❌ Failed to cache swap tokens:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
