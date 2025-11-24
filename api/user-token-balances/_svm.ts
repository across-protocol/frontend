import { BigNumber } from "ethers";
import * as sdk from "@across-protocol/sdk";
import { getLogger } from "../_utils";
import { getSvmBalance } from "../_balance";
import { SwapToken } from "../swap/tokens/_service";

const logger = getLogger();

export function getSvmTokenAddressesForChain(
  swapTokens: SwapToken[],
  chainId: number
): string[] {
  const tokens = swapTokens
    .filter((token) => token.chainId === chainId)
    .map((token) => token.address);

  return Array.from(new Set(tokens));
}

export async function fetchNativeBalance(
  chainId: number,
  account: string
): Promise<string | null> {
  try {
    logger.debug({
      at: "fetchNativeBalance",
      message: "Fetching native SVM balance",
      chainId,
      account,
    });

    const balance = await getSvmBalance(
      chainId,
      account,
      sdk.constants.ZERO_ADDRESS
    );

    return balance.toString();
  } catch (error) {
    logger.warn({
      at: "fetchNativeBalance",
      message: "Error fetching native SVM balance",
      chainId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function fetchSplTokenBalances(
  chainId: number,
  account: string,
  tokenAddresses: string[]
): Promise<Array<{ address: string; balance: string }>> {
  // Early return if no token addresses
  if (tokenAddresses.length === 0) {
    logger.debug({
      at: "fetchSplTokenBalances",
      message: "No SPL token addresses to fetch, returning empty array",
      chainId,
    });
    return [];
  }

  logger.debug({
    at: "fetchSplTokenBalances",
    message: "Fetching SPL token balances",
    chainId,
    account,
    tokenAddressCount: tokenAddresses.length,
  });

  // Fetch balances for all tokens in parallel
  const balancePromises = tokenAddresses.map(async (tokenAddress) => {
    try {
      const balance = await getSvmBalance(chainId, account, tokenAddress);
      return {
        address: tokenAddress,
        balance: balance.toString(),
      };
    } catch (error) {
      logger.warn({
        at: "fetchSplTokenBalances",
        message: "Error fetching balance for SPL token",
        chainId,
        tokenAddress,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  });

  const results = await Promise.all(balancePromises);

  // Filter out null results and zero balances
  const balances = results.filter(
    (result): result is { address: string; balance: string } =>
      result !== null && BigNumber.from(result.balance).gt(0)
  );

  return balances;
}

export async function fetchTokenBalancesForChain(
  chainId: number,
  account: string,
  tokenAddresses: string[]
): Promise<{
  chainId: number;
  balances: Array<{ address: string; balance: string }>;
}> {
  try {
    // Separate SPL tokens from native token
    const splTokenAddresses = tokenAddresses.filter(
      (addr) => addr !== sdk.constants.ZERO_ADDRESS
    );

    logger.debug({
      at: "fetchTokenBalancesForChain",
      message: "Fetching token balances for chain",
      chainId,
      totalTokens: tokenAddresses.length,
      splTokens: splTokenAddresses.length,
    });

    // Fetch both SPL tokens and native balance in parallel
    const [splBalances, nativeBalance] = await Promise.all([
      fetchSplTokenBalances(chainId, account, splTokenAddresses),
      fetchNativeBalance(chainId, account),
    ]);

    // Add native balance if it exists and is greater than 0
    const balances = [...splBalances];
    if (nativeBalance && BigNumber.from(nativeBalance).gt(0)) {
      balances.unshift({
        address: sdk.constants.ZERO_ADDRESS,
        balance: nativeBalance,
      });
    }

    return {
      chainId,
      balances,
    };
  } catch (error) {
    logger.warn({
      at: "fetchTokenBalancesForChain",
      message: "Error fetching SVM token balances, returning empty balances",
      chainId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      chainId,
      balances: [],
    };
  }
}
