import { BigNumber, constants } from "ethers";
import { MAINNET_CHAIN_IDs } from "@across-protocol/constants";
import * as sdk from "@across-protocol/sdk";
import axios from "axios";
import {
  getLogger,
  resolveVercelEndpoint,
  buildSearchParams,
  getVercelHeaders,
} from "../_utils";
import { isSvmAddress } from "../_address";
import { SwapToken } from "../swap/tokens/_service";
import { CHAIN_IDs, EVM_CHAIN_IDs } from "../_constants";
import { getBatchBalance } from "../_balance";

const logger = getLogger();

async function getSwapTokens(
  filteredChainIds?: number[]
): Promise<SwapToken[]> {
  try {
    const baseUrl = resolveVercelEndpoint();
    const params: { chainId?: number | number[] } = {};

    if (filteredChainIds && filteredChainIds.length > 0) {
      params.chainId =
        filteredChainIds.length === 1 ? filteredChainIds[0] : filteredChainIds;
    }

    const queryString = buildSearchParams(params);
    const url = queryString
      ? `${baseUrl}/api/swap/tokens?${queryString}`
      : `${baseUrl}/api/swap/tokens`;

    const response = await axios.get<SwapToken[]>(url, {
      headers: getVercelHeaders(),
    });

    return response.data;
  } catch (error) {
    logger.warn({
      at: "getSwapTokens",
      message: "Failed to fetch swap tokens from endpoint",
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

function getEvmChainIds(): number[] {
  return Object.values(MAINNET_CHAIN_IDs)
    .filter((chainId) => !sdk.utils.chainIsSvm(chainId))
    .sort((a, b) => a - b);
}

function getSvmChainIds(): number[] {
  return Object.values(MAINNET_CHAIN_IDs)
    .filter((chainId) => sdk.utils.chainIsSvm(chainId))
    .sort((a, b) => a - b);
}

function getTokenAddressesForChain(
  swapTokens: SwapToken[],
  chainId: number
): string[] {
  const tokens = swapTokens
    .filter((token) => token.chainId === chainId)
    .map((token) => token.address);

  return Array.from(new Set(tokens));
}

async function fetchTokenBalancesForChain(
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
      message: "Fetching token balances for chain using getBatchBalance",
      chainId,
      account,
      tokenCount: tokenAddresses.length,
    });

    // Ensure we add native
    const tokenAddressesWithNative = tokenAddresses.includes(
      sdk.constants.ZERO_ADDRESS
    )
      ? tokenAddresses
      : [sdk.constants.ZERO_ADDRESS, ...tokenAddresses];

    // getBatchBalance internally handles evm and svm
    const { balances: balancesMap } = await getBatchBalance(
      chainId,
      [account],
      tokenAddressesWithNative
    );

    const accountBalances = balancesMap[account] || {};

    // format to expected structure
    const balances = Object.entries(accountBalances)
      .filter(([tokenAddress, balance]) => {
        if (!balance) return false;
        try {
          const balanceBn = BigNumber.from(balance);
          // Filter out zero balances and MaxUint256 (invalid balance values) buggy response
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

    // not strictly necessary but useful for debugging
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
        "Error fetching token balances via getBatchBalance, returning empty balances",
      chainId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      chainId,
      balances: [],
    };
  }
}

export const handleUserTokenBalances = async (account: string) => {
  const isSolanaAddress = isSvmAddress(account);

  const chainIds = isSolanaAddress ? getSvmChainIds() : getEvmChainIds();

  const swapTokensChainIds = isSolanaAddress
    ? [CHAIN_IDs.SOLANA]
    : EVM_CHAIN_IDs;

  logger.debug({
    at: "handleUserTokenBalances",
    message: isSolanaAddress
      ? "Detected SVM address, fetching SVM balances"
      : "Detected EVM address, fetching EVM balances",
    account,
    chainCount: chainIds.length,
  });

  // get tokens for ecosystem
  const swapTokens = await getSwapTokens(swapTokensChainIds);

  logger.debug({
    at: "handleUserTokenBalances",
    message: "Fetched swap tokens",
    tokenCount: swapTokens.length,
  });

  const balancePromises = chainIds.map((chainId) => {
    const tokenAddresses = getTokenAddressesForChain(swapTokens, chainId);
    logger.debug({
      at: "handleUserTokenBalances",
      message: "Token addresses for chain",
      chainId,
      tokenAddressCount: tokenAddresses.length,
    });
    return fetchTokenBalancesForChain(chainId, account, tokenAddresses);
  });

  const chainBalances = await Promise.all(balancePromises);

  return {
    account,
    balances: chainBalances.map(({ chainId, balances }) => ({
      chainId: chainId.toString(),
      balances,
    })),
  };
};
