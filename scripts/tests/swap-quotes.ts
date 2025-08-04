import axios from "axios";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { writeFileSync } from "fs";
import { utils } from "ethers";
import { CHAIN_IDs } from "@across-protocol/constants";

import { buildSearchParams } from "../../api/_utils";

type Chain = {
  chainId: number;
  name: string;
  publicRpcUrl: string;
  explorerUrl: string;
  logoUrl: string;
};

type Token = {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUrl: string;
  priceUsd: string | null;
};

type SwapQuoteResult = {
  originChainId: number;
  destinationChainId: number;
  inputTokenAddress: string;
  inputTokenSymbol: string;
  outputTokenAddress: string;
  outputTokenSymbol: string;
  amount: string;
  tradeType: string;
  appFeeRecipient?: string;
  appFeePercent?: string;
  success: boolean;
  data?: any;
  error?: any;
};

const argsFromCli = yargs(hideBin(process.argv))
  .option("host", {
    alias: "h",
    description: "API host URL",
    default: "https://app.across.to",
    type: "string",
  })
  .option("output", {
    alias: "o",
    description: "JSON output file path",
    default: "./",
    type: "string",
  })
  .option("originChains", {
    alias: "oc",
    description:
      "Comma-separated list of chain IDs to test (e.g., '1,10,8453')",
    type: "string",
  })
  .option("destinationChains", {
    alias: "dc",
    description:
      "Comma-separated list of chain IDs to test (e.g., '1,10,8453')",
    type: "string",
  })
  .option("chains", {
    alias: "c",
    description:
      "Comma-separated list of chain IDs to test (e.g., '1,10,8453')",
    type: "string",
  })
  .option("tokens", {
    alias: "t",
    description:
      "Comma-separated list of token symbols to test (e.g., 'USDC,ETH,WETH')",
    type: "string",
  })
  .option("maxTokens", {
    alias: "mt",
    description: "Maximum number of tokens to test",
    default: 10,
    type: "number",
  })
  .option("amount", {
    alias: "a",
    description:
      "Human-readable amount to use for quotes (e.g., '1' for 1 token)",
    default: "1.0",
    type: "string",
  })
  .option("depositor", {
    alias: "d",
    description: "Depositor address for swaps",
    default: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
    type: "string",
  })
  .option("tradeType", {
    alias: "tt",
    description: "Trade type (exactInput, exactOutput or minOutput)",
    default: "exactInput",
    type: "string",
  })
  .option("appFeeRecipient", {
    alias: "afr",
    description: "App fee recipient address",
    type: "string",
  })
  .option("appFeePercent", {
    alias: "afp",
    description: "App fee percentage (0-1, e.g., 0.01 for 1%)",
    type: "string",
  })
  .help()
  .strict()
  .parseSync();

async function fetchSupportedChains(baseUrl: string): Promise<Chain[]> {
  console.log("Fetching supported chains...");
  const response = await axios.get(`${baseUrl}/api/swap/chains`);
  return response.data;
}

async function fetchSupportedTokens(baseUrl: string): Promise<Token[]> {
  console.log("Fetching supported tokens...");
  const response = await axios.get(`${baseUrl}/api/swap/tokens`);
  return response.data;
}

async function fetchSwapQuote(
  baseUrl: string,
  params: {
    originChainId: number;
    destinationChainId: number;
    inputToken: string;
    outputToken: string;
    amount: string;
    depositor: string;
    tradeType: string;
    appFeeRecipient?: string;
    appFeePercent?: string;
  }
): Promise<any> {
  const response = await axios.get(`${baseUrl}/api/swap/approval`, {
    params,
    paramsSerializer: buildSearchParams,
  });
  return response.data;
}

function filterChains(chains: Chain[], filterChainIds?: string): Chain[] {
  if (!filterChainIds) return chains;

  const targetChainIds = filterChainIds
    .split(",")
    .map((id) => parseInt(id.trim()));
  return chains.filter((chain) => targetChainIds.includes(chain.chainId));
}

function filterTokens(tokens: Token[], filterTokenSymbols?: string): Token[] {
  if (!filterTokenSymbols) return tokens;

  const targetSymbols = filterTokenSymbols
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase());
  return tokens.filter((token) =>
    targetSymbols.includes(token.symbol.toUpperCase())
  );
}

function normalizeAmount(humanAmount: string, decimals: number): string {
  return utils.parseUnits(humanAmount, decimals).toString();
}

// Chains that are supported by 0x and LI.FI
const defaultChains = [
  CHAIN_IDs.ARBITRUM,
  CHAIN_IDs.BASE,
  CHAIN_IDs.BLAST,
  CHAIN_IDs.BSC,
  CHAIN_IDs.LINEA,
  CHAIN_IDs.MAINNET,
  CHAIN_IDs.OPTIMISM,
  CHAIN_IDs.POLYGON,
  CHAIN_IDs.SCROLL,
  CHAIN_IDs.UNICHAIN,
  CHAIN_IDs.WORLD_CHAIN,
  CHAIN_IDs.LENS,
  CHAIN_IDs.SONEIUM,
  CHAIN_IDs.ZK_SYNC,
  CHAIN_IDs.INK,
  CHAIN_IDs.MODE,
];

async function main() {
  const {
    host,
    output,
    originChains: originChainFilter,
    destinationChains: destinationChainFilter,
    tokens: tokenFilter,
    maxTokens,
    amount,
    depositor,
    tradeType,
    appFeeRecipient,
    appFeePercent,
  } = argsFromCli;

  console.log(`Starting swap quotes test with host: ${host}`);
  console.log(`Output file: ${output}`);
  console.log(`Origin chain filter: ${originChainFilter || "default"}`);
  console.log(
    `Destination chain filter: ${destinationChainFilter || "default"}`
  );
  console.log(`Token filter: ${tokenFilter || "all"}`);
  console.log(`Max tokens: ${maxTokens}`);
  console.log(`Amount: ${amount}`);
  console.log(`Trade type: ${tradeType}`);
  console.log(`App fee recipient: ${appFeeRecipient || "none"}`);
  console.log(`App fee percent: ${appFeePercent || "none"}`);
  console.log("\n");

  try {
    // Fetch supported chains and tokens
    const [allChains, allTokens] = await Promise.all([
      fetchSupportedChains(host),
      fetchSupportedTokens(host),
    ]);

    // Filter chains and tokens based on CLI args
    const originChains = filterChains(
      allChains,
      originChainFilter || defaultChains.join(",")
    );
    const destinationChains = filterChains(
      allChains,
      destinationChainFilter || defaultChains.join(",")
    );
    const tokens = filterTokens(allTokens, tokenFilter).filter(
      (token) =>
        originChains.some((chain) => chain.chainId === token.chainId) ||
        destinationChains.some((chain) => chain.chainId === token.chainId)
    );

    console.log(
      `\nTesting ${originChains.length} origin chains, ${destinationChains.length} destination chains, and ${tokens.length} tokens`
    );

    const results: SwapQuoteResult[] = [];

    // Test each chain/token combination
    for (const originChain of originChains) {
      for (const destinationChain of destinationChains) {
        if (destinationChain.chainId === originChain.chainId) {
          continue;
        }

        const destinationChainId = destinationChain.chainId;

        const inputTokens = tokens.filter(
          (token) => token.chainId === originChain.chainId
        );

        if (inputTokens.length === 0) {
          console.log(
            `No input tokens found for chain ${originChain.name} (${originChain.chainId}), skipping...`
          );
          continue;
        }

        // Find a suitable output token on destination chain
        const destinationTokens = allTokens.filter(
          (t) => t.chainId === destinationChainId
        );

        if (destinationTokens.length === 0) {
          console.log(
            `No tokens found for destination chain ${destinationChainId}, skipping...`
          );
          continue;
        }

        const maxTokensToTest = Math.min(maxTokens, inputTokens.length);
        const inputTokensToTest = inputTokens.slice(0, maxTokensToTest);

        for (const inputToken of inputTokensToTest) {
          console.log([
            originChain.name,
            destinationChain.name,
            inputToken.symbol,
          ]);

          // Calculate normalized amount based on token decimals
          const normalizedAmount = normalizeAmount(amount, inputToken.decimals);

          const sameAsset = destinationTokens.find(
            (t) => t.symbol === inputToken.symbol
          );
          const usdc = destinationTokens.find((t) =>
            ["USDC", "DAI", "USDT"].includes(t.symbol)
          );
          const randomToken =
            destinationTokens[
              Math.floor(Math.random() * destinationTokens.length)
            ];

          // unique output tokens
          const outputTokens = [sameAsset, usdc, randomToken]
            .filter((t) => t !== undefined)
            .filter(
              (t, index, self) =>
                self.findIndex((t2) => t2.address === t.address) === index
            );

          for (const outputToken of outputTokens) {
            try {
              console.log(
                "Fetching quote for",
                [
                  `${inputToken.symbol} (${originChain.chainId})`,
                  `${outputToken.symbol} (${destinationChainId})`,
                ].join(" -> ")
              );

              const quoteParams = {
                originChainId: originChain.chainId,
                destinationChainId,
                inputToken: inputToken.address,
                outputToken: outputToken.address,
                amount: normalizedAmount,
                depositor,
                tradeType,
                ...(appFeeRecipient &&
                  appFeePercent && {
                    appFeeRecipient,
                    appFeePercent,
                  }),
              };

              const quoteData = await fetchSwapQuote(host, quoteParams);

              results.push({
                originChainId: originChain.chainId,
                destinationChainId: destinationChainId,
                inputTokenAddress: inputToken.address,
                inputTokenSymbol: inputToken.symbol,
                outputTokenAddress: outputToken.address,
                outputTokenSymbol: outputToken.symbol,
                amount: normalizedAmount,
                tradeType,
                appFeeRecipient,
                appFeePercent,
                success: true,
                data: quoteData,
              });
            } catch (error: any) {
              console.error(
                "Failed to fetch quote",
                error?.response?.data || error.message
              );

              results.push({
                originChainId: originChain.chainId,
                destinationChainId: destinationChainId,
                inputTokenAddress: inputToken.address,
                inputTokenSymbol: inputToken.symbol,
                outputTokenAddress: outputToken.address,
                outputTokenSymbol: outputToken.symbol,
                amount: normalizedAmount,
                tradeType,
                appFeeRecipient,
                appFeePercent,
                success: false,
                error: {
                  message: error.message || "Unknown error",
                  code: error.response?.data?.code || "UNKNOWN_ERROR",
                  status: error.response?.data?.status,
                  requestId: error.response?.data?.requestId,
                },
              });
            } finally {
              // Add a small delay to avoid overwhelming the API
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }
        }
      }
    }

    // Generate and save CSV and JSON
    const jsonContent = JSON.stringify(results, null, 2);
    writeFileSync(
      `${output}swap-quotes-${new Date().toISOString()}.json`,
      jsonContent
    );

    console.log(`\nResults saved to: ${output}`);
    console.log(`Total tests: ${results.length}`);
    console.log(`Successful: ${results.filter((r) => r.success).length}`);
    console.log(`Failed: ${results.filter((r) => !r.success).length}`);
  } catch (error: any) {
    console.error("Script failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => console.log("Done"))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
