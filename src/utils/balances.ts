import { ERC20__factory } from "@across-protocol/contracts";
import { providers } from "ethers";
import { callViaMulticall3 } from "../../api/_utils";
import { getProvider } from "./providers";
import { getMulticall3, ZERO_ADDRESS } from "./sdk";
import { useQuery } from "@tanstack/react-query";

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
  tokenAddresses: string[],
  blockTag: providers.BlockTag = "latest"
): Promise<MultiCallResult> => {
  const chainIdAsInt = Number(chainId);
  const provider = getProvider(chainIdAsInt);

  const multicall3 = getMulticall3(chainIdAsInt, provider);

  if (!multicall3) {
    throw new Error("No Multicall3 deployed on this chain");
  }

  let calls: Parameters<typeof callViaMulticall3>[1] = [];

  for (const tokenAddress of tokenAddresses) {
    if (tokenAddress === ZERO_ADDRESS) {
      // For native currency
      calls.push(
        ...addresses.map((address) => ({
          contract: multicall3,
          functionName: "getEthBalance",
          args: [address],
        }))
      );
    } else {
      // For ERC20 tokens
      const erc20Contract = ERC20__factory.connect(tokenAddress, provider);
      calls.push(
        ...addresses.map((address) => ({
          contract: erc20Contract,
          functionName: "balanceOf",
          args: [address],
        }))
      );
    }
  }

  const inputs = calls.map(({ contract, functionName, args }) => ({
    target: contract.address,
    callData: contract.interface.encodeFunctionData(functionName, args),
  }));

  const [blockNumber, results] = await multicall3.callStatic.aggregate(inputs, {
    blockTag,
  });

  const decodedResults = results.map((result, i) =>
    calls[i].contract.interface.decodeFunctionResult(
      calls[i].functionName,
      result
    )
  );

  let balances: Record<string, Record<string, string>> = {};

  let resultIndex = 0;
  for (const tokenAddress of tokenAddresses) {
    addresses.forEach((address) => {
      if (!balances[address]) {
        balances[address] = {};
      }
      balances[address][tokenAddress] = decodedResults[resultIndex].toString();
      resultIndex++;
    });
  }

  return {
    blockNumber: blockNumber.toNumber(),
    balances,
  };
};

// Define the type representing an individual balance request.
interface BalanceRequest {
  token: string;
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
    token: string,
    address: string,
    blockTag: providers.BlockTag = "latest"
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      //  Create active batch for this chain
      if (!this.batchQueue[chainId]) {
        this.batchQueue[chainId] = {
          chainId,
          blockTag,
          aggregatedTokens: new Set([token]),
          aggregatedAddresses: new Set([address]),
          requests: [{ token, address, resolve, reject }],
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

            currentBatch.requests.forEach(({ token, address, resolve }) => {
              const balance = result.balances[address]?.[token] || "0";
              resolve(balance);
            });
          } catch (error) {
            currentBatch.requests.forEach(({ reject }) => reject(error));
          }
        }, this.batchInterval);
      } else {
        // batch already exists for this interval, just add another
        const existingBatch = this.batchQueue[chainId];
        existingBatch.aggregatedTokens.add(token);
        existingBatch.aggregatedAddresses.add(address);
        existingBatch.requests.push({ token, address, resolve, reject });
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
  token,
  address,
  blockTag,
  options,
}: {
  chainId: number;
  token: string;
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
      token,
      address,
      blockTag ?? "latest",
    ] as const,
    queryFn: () =>
      balanceBatcher.queueBalanceCall(
        chainId,
        token,
        address,
        blockTag ?? "latest"
      ),
    ...options,
  });
}
