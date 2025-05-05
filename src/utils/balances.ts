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

  const inputs: { target: string; callData: string }[] = [];

  // Create a generic ERC20 contract for encoding function calls
  const genericErc20 = ERC20__factory.connect(ZERO_ADDRESS, provider);

  // Map to track which token and address each call corresponds to
  type CallInfo = {
    tokenSymbol: string;
    address: string;
    isNative: boolean;
  };
  const callMap: CallInfo[] = [];

  // Process native token first if needed
  const nativeSymbol = tokenSymbols.find(
    (symbol) => chainInfo.nativeCurrencySymbol === symbol
  );
  if (nativeSymbol) {
    for (const address of addresses) {
      inputs.push({
        target: multicall3.address,
        callData: multicall3.interface.encodeFunctionData("getEthBalance", [
          address,
        ]),
      });
      callMap.push({ tokenSymbol: nativeSymbol, address, isNative: true });
    }
  }

  // Process ERC20 tokens
  const erc20Symbols = tokenSymbols.filter(
    (symbol) => chainInfo.nativeCurrencySymbol !== symbol
  );
  const tokenAddresses: string[] = [];

  // Get all token addresses first
  for (const symbol of erc20Symbols) {
    const tokenInfo = getToken(symbol);
    const tokenAddress = tokenInfo?.addresses?.[chainIdAsInt];
    if (!tokenAddress) {
      throw new Error(
        `No address found for token symbol ${symbol} for chainId ${chainId}`
      );
    }
    tokenAddresses.push(tokenAddress);
  }

  // Generate balanceOf calls for all addresses and tokens
  for (const address of addresses) {
    // Create the callData once for this address
    const balanceOfCallData = genericErc20.interface.encodeFunctionData(
      "balanceOf",
      [address]
    );

    // Reuse this callData for each token
    for (let i = 0; i < erc20Symbols.length; i++) {
      const symbol = erc20Symbols[i];
      const tokenAddress = tokenAddresses[i];

      inputs.push({
        target: tokenAddress,
        callData: balanceOfCallData,
      });

      callMap.push({ tokenSymbol: symbol, address, isNative: false });
    }
  }

  const [blockNumber, results] = await multicall3.callStatic.aggregate(inputs, {
    blockTag,
  });

  // Decode the results using the appropriate interface
  const decodedResults = results.map((result, i) => {
    const { isNative } = callMap[i];
    if (isNative) {
      return multicall3.interface.decodeFunctionResult("getEthBalance", result);
    } else {
      return genericErc20.interface.decodeFunctionResult("balanceOf", result);
    }
  });

  let balances: Record<string, Record<string, string>> = {};

  // Process results
  decodedResults.forEach((decodedResult, index) => {
    const { tokenSymbol, address } = callMap[index];
    const tokenInfo = getToken(tokenSymbol);
    const tokenAddress = tokenInfo.addresses?.[chainIdAsInt];

    if (!tokenAddress) {
      throw new Error(
        `No address found for token symbol ${tokenSymbol} for chainId ${chainId}`
      );
    }

    if (!balances[address]) {
      balances[address] = {};
    }

    balances[address][tokenAddress] = decodedResult.toString();
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

// Do something with this singleton
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
