import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { fetchSwapTokensData, SwapToken } from "../api/swap/tokens/_service";

export interface SwapTokensCache {
  tokens: SwapToken[];
  timestamp: number;
  version: string;
}

async function main() {
  try {
    console.log("Fetching swap tokens data...");
    const tokens = await fetchSwapTokensData();

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
