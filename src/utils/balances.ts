import { ERC20__factory } from "@across-protocol/contracts";
import { providers } from "ethers";
import { getProvider } from "./providers";
import { getMulticall3, ZERO_ADDRESS } from "./sdk";
import { useQuery } from "@tanstack/react-query";
import { getChainInfo, getToken } from "./constants";

export type MultiCallResult = {
  blockNumber: providers.BlockTag;
  // { [walletAddress]: { [tokenAddress]: balanceString } }
  balances: Record<string, Record<string, string>>;
};

/**
 * Fetches the balances for an array of addresses on a particular chain, for a particular erc20 token
 * @param chainId The blockchain Id to query against
 * @param addresses An array of valid Web3 wallet addresses
 * @param tokenAddress The valid ERC20 token address on the given `chainId` or ZERO_ADDRESS for native balances
 * @param blockTag Block to query from, defaults to latest block
 * @returns a Promise that resolves to an array of BigNumbers
 */
export const getBatchBalanceViaMulticall3 = async (
  chainId: string | number,
  addresses: string[],
  tokenSymbols: string[],
  blockTag: providers.BlockTag = "latest"
): Promise<MultiCallResult> => {
  const chainIdAsInt = Number(chainId);
  const chainInfo = getChainInfo(chainIdAsInt);
  const provider = getProvider(chainIdAsInt);

  const multicall3 = getMulticall3(chainIdAsInt, provider);
  if (!multicall3) {
    throw new Error("No Multicall3 deployed on this chain");
  }

  // Create a generic ERC20 contract for encoding function calls
  const genericErc20 = ERC20__factory.connect(ZERO_ADDRESS, provider);

  const inputs: { target: string; callData: string }[] = [];
  const callMap: { tokenSymbol: string; address: string; isNative: boolean }[] =
    [];

  // Initialize result structure - set all balances to "0" by default
  const balances = addresses.reduce(
    (acc, address) => {
      acc[address] = tokenSymbols.reduce(
        (symbolAcc, symbol) => {
          symbolAcc[symbol] = "0";
          return symbolAcc;
        },
        {} as Record<string, string>
      );
      return acc;
    },
    {} as Record<string, Record<string, string>>
  );

  // Find native token if present
  const nativeSymbol = tokenSymbols.find(
    (symbol) => chainInfo.nativeCurrencySymbol === symbol
  );

  // Process native token calls if needed
  if (nativeSymbol) {
    addresses.forEach((address) => {
      inputs.push({
        target: multicall3.address,
        callData: multicall3.interface.encodeFunctionData("getEthBalance", [
          address,
        ]),
      });
      callMap.push({ tokenSymbol: nativeSymbol, address, isNative: true });
    });
  }

  // Filter for valid ERC20 tokens and get their addresses
  const erc20Data = tokenSymbols
    .filter((symbol) => symbol !== chainInfo.nativeCurrencySymbol)
    .map((symbol) => {
      const tokenInfo = getToken(symbol);
      const address = tokenInfo?.addresses?.[chainIdAsInt];
      return { symbol, address, valid: !!address };
    })
    .filter(({ valid }) => valid);

  // Process valid ERC20 tokens
  addresses.forEach((address) => {
    // Create balanceOf callData once per address
    const balanceOfCallData = genericErc20.interface.encodeFunctionData(
      "balanceOf",
      [address]
    );

    // Add calls for each valid token
    erc20Data.forEach(({ symbol, address: tokenAddress }) => {
      if (tokenAddress) {
        inputs.push({
          target: tokenAddress,
          callData: balanceOfCallData,
        });
        callMap.push({ tokenSymbol: symbol, address, isNative: false });
      }
    });
  });

  // Skip the multicall if no valid calls
  if (inputs.length === 0) {
    return {
      blockNumber: 0,
      balances,
    };
  }

  // Execute the multicall
  const [blockNumber, results] = await multicall3.callStatic.aggregate(inputs, {
    blockTag,
  });

  // Decode results and update balances
  results.forEach((result, i) => {
    const { tokenSymbol, address, isNative } = callMap[i];
    const value = isNative
      ? multicall3.interface.decodeFunctionResult("getEthBalance", result)
      : genericErc20.interface.decodeFunctionResult("balanceOf", result);

    balances[address][tokenSymbol] = value.toString();
  });

  return {
    blockNumber: blockNumber.toNumber(),
    balances,
  };
};

// Define the type representing an individual balance request.
interface BalanceRequest {
  tokenSymbol: string;
  address: string;
  resolve: (balance: string) => void;
  reject: (error: any) => void;
}

// Define the type for a batch request that aggregates multiple balance requests.
interface BatchRequest {
  chainId: number;
  blockTag: providers.BlockTag;
  aggregatedTokens: Set<string>;
  aggregatedAddresses: Set<string>;
  requests: BalanceRequest[];
  timer?: NodeJS.Timeout;
}

const DEFAULT_BATCH_INTERVAL = 100;

export type BalanceBatcherFetchFn = typeof getBatchBalanceViaMulticall3;

export class BalanceBatcher {
  private batchQueue: Record<number, BatchRequest> = {};

  constructor(
    readonly fetcher: BalanceBatcherFetchFn,
    readonly batchInterval = DEFAULT_BATCH_INTERVAL
  ) {}

  /**
   * Queues an individual balance request. All requests for the same chain
   * (and assumed same blockTag) within batchInterval (ms) are batched together.
   *
   * @param chainId The chain ID.
   * @param token The ERC20 token address or zero address for native balance
   * @param address The address we want to fetch the balance for
   * @param blockTag The block tag (defaults to "latest").
   * @returns A Promise resolving to the token balance as a string.
   */
  public async queueBalanceCall(
    chainId: number,
    tokenSymbol: string,
    address: string,
    blockTag: providers.BlockTag = "latest"
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      //  Create active batch for this chain
      if (!this.batchQueue[chainId]) {
        this.batchQueue[chainId] = {
          chainId,
          blockTag,
          aggregatedTokens: new Set([tokenSymbol]),
          aggregatedAddresses: new Set([address]),
          requests: [{ tokenSymbol, address, resolve, reject }],
        };

        this.batchQueue[chainId].timer = setTimeout(async () => {
          const currentBatch = this.batchQueue[chainId];
          delete this.batchQueue[chainId];

          const tokensArray = Array.from(currentBatch.aggregatedTokens);
          const addressesArray = Array.from(currentBatch.aggregatedAddresses);

          try {
            const result: MultiCallResult = await this.fetcher(
              chainId,
              addressesArray,
              tokensArray,
              currentBatch.blockTag
            );

            currentBatch.requests.forEach(
              ({ tokenSymbol, address, resolve }) => {
                const balance = result.balances[address]?.[tokenSymbol] || "0";
                resolve(balance);
              }
            );
          } catch (error) {
            currentBatch.requests.forEach(({ reject }) => reject(error));
          }
        }, this.batchInterval);
      } else {
        // batch already exists for this interval, just add another
        const existingBatch = this.batchQueue[chainId];
        existingBatch.aggregatedTokens.add(tokenSymbol);
        existingBatch.aggregatedAddresses.add(address);
        existingBatch.requests.push({ tokenSymbol, address, resolve, reject });
      }
    });
  }
}

// In-memory singleton
export const balanceBatcher = new BalanceBatcher(getBatchBalanceViaMulticall3);

/**
 * @param chainId The blockchain chain ID.
 * @param tokenAddress The ERC20 token address.
 * @param walletAddress The wallet address whose balance will be fetched.
 * @param blockTag Optional blockTag (defaults to "latest").
 * @returns An object containing the balance (a string), loading state, and any error.
 */
export function useBalance({
  chainId,
  tokenSymbol,
  address,
  blockTag,
  options,
}: {
  chainId: number;
  tokenSymbol: string;
  address: string;
  blockTag?: providers.BlockTag;
  options?: Partial<
    Omit<Parameters<typeof useQuery>[0], "queryKey" | "queryFn">
  >;
}) {
  return useQuery({
    queryKey: [
      "balance",
      chainId,
      tokenSymbol,
      address,
      blockTag ?? "latest",
    ] as const,
    queryFn: () =>
      balanceBatcher.queueBalanceCall(
        chainId,
        tokenSymbol,
        address,
        blockTag ?? "latest"
      ),
    ...options,
  });
}
