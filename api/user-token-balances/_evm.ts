import { BigNumber, constants } from "ethers";
import * as sdk from "@across-protocol/sdk";
import { getLogger } from "../_utils";
import { getBatchBalanceViaMulticall3 } from "../_balance";
import { SwapToken } from "../swap/tokens/_service";

const logger = getLogger();

export function getTokenAddressesForChain(
  swapTokens: SwapToken[],
  chainId: number
): string[] {
  const tokens = swapTokens
    .filter((token) => token.chainId === chainId)
    .map((token) => token.address);

  return Array.from(new Set(tokens));
}

export async function fetchTokenBalancesForChain(
  chainId: number,
  account: string,
  tokenAddresses: string[]
): Promise<{
  chainId: number;
  balances: Array<{ address: string; balance: string }>;
}> {
  // Early return if no token addresses
  if (tokenAddresses.length === 0) {
    logger.debug({
      at: "fetchTokenBalancesForChain",
      message: "No token addresses to fetch, returning empty array",
      chainId,
    });
    return {
      chainId,
      balances: [],
    };
  }

  try {
    logger.debug({
      at: "fetchTokenBalancesForChain",
      message: "Fetching token balances for chain using Multicall",
      chainId,
      account,
      tokenCount: tokenAddresses.length,
    });

    // Ensure ZERO_ADDRESS is included for native balance
    const tokenAddressesWithNative = tokenAddresses.includes(
      sdk.constants.ZERO_ADDRESS
    )
      ? tokenAddresses
      : [sdk.constants.ZERO_ADDRESS, ...tokenAddresses];

    // Use Multicall to fetch all balances (including native)
    const { balances: balancesMap } = await getBatchBalanceViaMulticall3(
      chainId,
      [account],
      tokenAddressesWithNative
    );

    // Extract balances for the account
    const accountBalances = balancesMap[account] || {};

    // Convert to array format and filter out zero balances and invalid values
    const balances = Object.entries(accountBalances)
      .filter(([tokenAddress, balance]) => {
        if (!balance) return false;
        try {
          const balanceBn = BigNumber.from(balance);
          // Filter out zero balances and MaxUint256 (invalid balance values)
          return balanceBn.gt(0) && balanceBn.lt(constants.MaxUint256);
        } catch (error) {
          logger.warn({
            at: "fetchTokenBalancesForChain",
            message: "Invalid token balance value",
            chainId,
            tokenAddress,
            balance,
          });
          return false;
        }
      })
      .map(([address, balance]) => ({
        address,
        balance: balance as string,
      }));

    // Sort so native balance (ZERO_ADDRESS) comes first if present
    balances.sort((a, b) => {
      if (a.address === sdk.constants.ZERO_ADDRESS) return -1;
      if (b.address === sdk.constants.ZERO_ADDRESS) return 1;
      return 0;
    });

    logger.debug({
      at: "fetchTokenBalancesForChain",
      message: "Successfully fetched token balances",
      chainId,
      account,
      balanceCount: balances.length,
    });

    return {
      chainId,
      balances,
    };
  } catch (error) {
    logger.warn({
      at: "fetchTokenBalancesForChain",
      message:
        "Error fetching token balances via Multicall, returning empty balances",
      chainId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      chainId,
      balances: [],
    };
  }
}
