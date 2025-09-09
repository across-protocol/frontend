import axios, { AxiosError } from "axios";
import { mkdirSync, existsSync } from "fs";
import path from "path";
import { getEnvs } from "../api/_env";
import { CHAIN_IDs } from "@across-protocol/constants";
import { writeFileWithChangeDetection } from "./utils/codegen-utils";

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

const JUPITER_SOURCES_TO_EXCLUDE: string[] = [
  // TODO: Add any Jupiter sources we want to exclude here
];

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

async function fetchJupiterSources(): Promise<DexSources> {
  const { CHAIN_IDs: chainIds } = await import("@across-protocol/constants");
  const solanaChainId = chainIds.SOLANA;

  const sources: DexSources = {
    strategy: "jupiter",
    sources: {},
  };

  try {
    const response = await axios.get<Record<string, string>>(
      "https://lite-api.jup.ag/swap/v1/program-id-to-label"
    );

    const programLabels = response.data;
    const sourceNames = Object.values(programLabels);

    console.log(`Jupiter: ✓ Fetched ${sourceNames.length} sources from API`);

    const filteredSources = sourceNames.filter(
      (name) => !JUPITER_SOURCES_TO_EXCLUDE.includes(name)
    );

    const sourceEntries = filteredSources.map((name) => {
      // Normalize the name: lowercase, replace spaces and special chars with underscores
      const normalizedName = name.toLowerCase().replace(/[\s.]+/g, "_");

      return {
        key: name, // Keep original as key for Jupiter API
        names: Array.from(new Set([name, name.toLowerCase(), normalizedName])),
      };
    });

    sources.sources[solanaChainId] = sourceEntries;

    console.log(
      `Jupiter: ✓ Generated ${filteredSources.length} sources for Solana mainnet`
    );
  } catch (error) {
    console.error("Jupiter: Error fetching sources", error);
  }

  return sources;
}

function generateSourcesCode(sources: DexSources): string {
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

  return `export const SOURCES = ${JSON.stringify(sources)} as {
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
  const jupiterUtilsDir = path.join(
    process.cwd(),
    "api",
    "_dexes",
    "jupiter",
    "utils"
  );

  if (!existsSync(zeroXUtilsDir)) {
    mkdirSync(zeroXUtilsDir, { recursive: true });
  }

  if (!existsSync(lifiUtilsDir)) {
    mkdirSync(lifiUtilsDir, { recursive: true });
  }

  if (!existsSync(jupiterUtilsDir)) {
    mkdirSync(jupiterUtilsDir, { recursive: true });
  }

  try {
    // Fetch sources
    const [zeroXSources, lifiSources, jupiterSources] = await Promise.all([
      fetch0xSources(),
      fetchLiFiSources(),
      fetchJupiterSources(),
    ]);

    // Generate source files
    const zeroXCode = generateSourcesCode(zeroXSources);
    const lifiCode = generateSourcesCode(lifiSources);
    const jupiterCode = generateSourcesCode(jupiterSources);

    const zeroXPath = path.join(zeroXUtilsDir, "sources.ts");
    const lifiPath = path.join(lifiUtilsDir, "sources.ts");
    const jupiterPath = path.join(jupiterUtilsDir, "sources.ts");

    // Write files with change detection
    await writeFileWithChangeDetection(
      zeroXPath,
      "This file contains available liquidity sources for 0x DEX integration",
      zeroXCode
    );
    await writeFileWithChangeDetection(
      lifiPath,
      "This file contains available liquidity sources for LiFi DEX integration",
      lifiCode
    );
    await writeFileWithChangeDetection(
      jupiterPath,
      "This file contains available liquidity sources for Jupiter DEX integration",
      jupiterCode
    );
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
