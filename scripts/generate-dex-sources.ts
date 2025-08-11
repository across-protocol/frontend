import axios, { AxiosError } from "axios";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import * as prettier from "prettier";
import path from "path";
import { getEnvs } from "../api/_env";
import { CHAIN_IDs } from "@across-protocol/constants";

const { API_KEY_0X } = getEnvs();

type DexSources = {
  strategy: string;
  sources: {
    [chainId: number]: {
      key: string; // Source key used by the DEX API
      names: string[]; // Source names that match the key
    }[];
  };
};

type LiFiTool = {
  name: string;
  key: string;
  logoURI: string;
  supportedChains: number[];
};

type LiFiSourcesResponse = {
  bridges: LiFiTool[];
  exchanges: LiFiTool[];
};

const LIFI_SOURCES_TO_EXCLUDE = ["0x"];

async function fetch0xSources(): Promise<DexSources> {
  const chains = Object.values(CHAIN_IDs);
  const sources: DexSources = {
    strategy: "0x",
    sources: {},
  };

  for (const chain of chains) {
    try {
      // https://0x.org/docs/api#tag/Sources
      const response = await axios.get<{ sources: string[] }>(
        "https://api.0x.org/sources",
        {
          params: {
            chainId: chain,
          },
          headers: {
            "0x-api-key": API_KEY_0X || "",
            "0x-version": "v2",
          },
        }
      );

      console.log(
        `0x: ✓ Fetched ${response.data.sources.length} sources from API for chain ${chain}`
      );
      sources.sources[chain] = response.data.sources.map((source: string) => ({
        key: source,
        names: Array.from(
          new Set([
            // Lowercase source name
            source.toLowerCase(),
            // Remove version number from source name
            source
              .replace(/([A-Za-z]+)_V\d+(?:\.\d+)?(?:_\d+)?$/gi, "$1")
              .toLowerCase(),
          ])
        ),
      }));
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 400) {
        console.log(`0x: No sources found for chain ${chain}`);
        continue;
      }
      console.error(`0x: Error fetching sources for chain ${chain}`, error);
      continue;
    }
  }
  return sources;
}

async function fetchLiFiSources(): Promise<DexSources> {
  const chains = Object.values(CHAIN_IDs);
  const sources: DexSources = {
    strategy: "lifi",
    sources: {},
  };

  for (const chain of chains) {
    try {
      // https://apidocs.li.fi/reference/get_v1-tools
      const response = await axios.get("https://li.quest/v1/tools", {
        params: {
          chains: chain,
        },
      });

      const data: LiFiSourcesResponse = response.data;
      const _sources = data.exchanges || [];

      console.log(
        `LiFi: ✓ Fetched ${_sources.length} sources from API for chain ${chain}`
      );

      // If we got an empty array from the API, use fallback sources
      if (_sources.length === 0) {
        continue;
      }

      // Filter out sources to exclude
      const filteredSources = _sources.filter(
        (source) =>
          !(
            LIFI_SOURCES_TO_EXCLUDE.includes(source.key) ||
            LIFI_SOURCES_TO_EXCLUDE.includes(source.name)
          )
      );

      sources.sources[chain] = filteredSources.map((source) => ({
        key: source.key,
        names: [source.key],
      }));
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 400) {
        console.log(`LiFi: No sources found for chain ${chain}`);
        continue;
      }
      console.error(`LiFi: Error fetching sources for chain ${chain}`, error);
      continue;
    }
  }
  return sources;
}

function generateSourcesFile(sources: DexSources, fileName: string): string {
  const allSources = Array.from(
    new Set([
      ...Object.values(sources.sources)
        .flat()
        .map((source) => source.names.map((name) => `"${name}"`))
        .flat(),
    ])
  )
    .sort()
    .map((source) => `  ${source}`)
    .join(",\n");

  return `// Auto-generated file. Do not edit manually.
// Generated on ${new Date().toISOString()}
// This file contains available liquidity sources for ${fileName.includes("0x") ? "0x" : "LiFi"} DEX integration

export const SOURCES = ${JSON.stringify(sources)} as {
  strategy: string;
  sources: {
    [chainId: number]: {
      key: string; // Source key used by the DEX API
      names: string[]; // Source names that match the key
    }[];
  };
};

export const ALL_SOURCES = [
  ${allSources}
] as const;

`;
}

async function generateDexSources() {
  console.log("🔄 Generating DEX sources...");

  // Create directories if they don't exist
  const zeroXUtilsDir = path.join(
    process.cwd(),
    "api",
    "_dexes",
    "0x",
    "utils"
  );
  const lifiUtilsDir = path.join(
    process.cwd(),
    "api",
    "_dexes",
    "lifi",
    "utils"
  );

  if (!existsSync(zeroXUtilsDir)) {
    mkdirSync(zeroXUtilsDir, { recursive: true });
  }

  if (!existsSync(lifiUtilsDir)) {
    mkdirSync(lifiUtilsDir, { recursive: true });
  }

  try {
    // Fetch sources from both APIs
    const [zeroXSources, lifiSources] = await Promise.all([
      fetch0xSources(),
      fetchLiFiSources(),
    ]);

    // Generate source files
    const zeroXSourcesContent = generateSourcesFile(zeroXSources, "0x");
    const lifiSourcesContent = generateSourcesFile(lifiSources, "lifi");

    // Format and write files
    const zeroXPath = path.join(zeroXUtilsDir, "sources.ts");
    const lifiPath = path.join(lifiUtilsDir, "sources.ts");

    writeFileSync(
      zeroXPath,
      await prettier.format(zeroXSourcesContent, { parser: "typescript" })
    );

    writeFileSync(
      lifiPath,
      await prettier.format(lifiSourcesContent, { parser: "typescript" })
    );

    console.log(`✅ Generated 0x sources file: ${zeroXPath}`);
    console.log(`✅ Generated LiFi sources file: ${lifiPath}`);
  } catch (error) {
    console.error("❌ Error generating DEX sources:", error);
    process.exit(1);
  }
}

// Run the script
generateDexSources().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
