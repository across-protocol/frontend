import { BigNumber, ethers } from "ethers";
import { MAINNET_CHAIN_IDs } from "@across-protocol/constants";
import * as sdk from "@across-protocol/sdk";
import { getLogger } from "../_utils";
import { getAlchemyRpcFromConfigJson } from "../_providers";
import { isSvmAddress } from "../_address";
import { getSvmBalance } from "../_balance";
import { fetchSwapTokensData, SwapToken } from "../swap/tokens/_service";

const logger = getLogger();

async function getSwapTokens(): Promise<SwapToken[]> {
  try {
    return await fetchSwapTokensData();
  } catch (error) {
    logger.warn({
      at: "getSwapTokens",
      message: "Failed to fetch swap tokens",
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

function getEvmChainIds(): number[] {
  return Object.values(MAINNET_CHAIN_IDs)
    .filter((chainId) => !sdk.utils.chainIsSvm(chainId))
    .filter((chainId) => !!getAlchemyRpcFromConfigJson(chainId))
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

  // Remove duplicates and filter out native token (AddressZero) since we fetch it separately
  return Array.from(
    new Set(tokens.filter((addr) => addr !== ethers.constants.AddressZero))
  );
}

function getSvmTokenAddressesForChain(
  swapTokens: SwapToken[],
  chainId: number
): string[] {
  const tokens = swapTokens
    .filter((token) => token.chainId === chainId)
    .map((token) => token.address);

  // Remove duplicates and filter out native token (zero address) since we fetch it separately
  return Array.from(
    new Set(tokens.filter((addr) => addr !== sdk.constants.ZERO_ADDRESS))
  );
}

const fetchNativeBalance = async (
  chainId: number,
  account: string,
  rpcUrl: string
): Promise<string | null> => {
  try {
    logger.debug({
      at: "fetchNativeBalance",
      message: "Fetching native balance",
      chainId,
      account,
    });

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [account, "latest"],
      }),
    });

    if (!response.ok) {
      logger.warn({
        at: "fetchNativeBalance",
        message: "HTTP error fetching native balance",
        chainId,
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    const data = await response.json();

    if (!data || !data.result) {
      logger.warn({
        at: "fetchNativeBalance",
        message: "Invalid response for native balance",
        chainId,
        responseData: data,
      });
      return null;
    }

    return BigNumber.from(data.result).toString();
  } catch (error) {
    logger.warn({
      at: "fetchNativeBalance",
      message: "Error fetching native balance",
      chainId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

const fetchSolanaTokenBalances = async (
  chainId: number,
  account: string,
  tokenAddresses: string[]
): Promise<{
  chainId: number;
  balances: Array<{ address: string; balance: string }>;
}> => {
  try {
    logger.debug({
      at: "fetchSolanaTokenBalances",
      message: "Fetching Solana token balances",
      chainId,
      account,
      tokenAddressCount: tokenAddresses.length,
    });

    // Include native SOL balance (zero address)
    const allTokenAddresses = [sdk.constants.ZERO_ADDRESS, ...tokenAddresses];

    // Fetch balances for all tokens in parallel
    const balancePromises = allTokenAddresses.map(async (tokenAddress) => {
      try {
        const balance = await getSvmBalance(chainId, account, tokenAddress);
        return {
          address: tokenAddress,
          balance: balance.toString(),
        };
      } catch (error) {
        logger.warn({
          at: "fetchSolanaTokenBalances",
          message: "Error fetching balance for token",
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

    return {
      chainId,
      balances,
    };
  } catch (error) {
    logger.warn({
      at: "fetchSolanaTokenBalances",
      message: "Error fetching Solana token balances, returning empty balances",
      chainId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      chainId,
      balances: [],
    };
  }
};

export const fetchTokenBalancesForChain = async (
  chainId: number,
  account: string,
  tokenAddresses: string[]
): Promise<{
  chainId: number;
  balances: Array<{ address: string; balance: string }>;
}> => {
  const rpcUrl = getAlchemyRpcFromConfigJson(chainId);

  if (!rpcUrl) {
    logger.warn({
      at: "fetchTokenBalancesForChain",
      message: "No Alchemy RPC URL found for chain, returning empty balances",
      chainId,
    });
    return {
      chainId,
      balances: [],
    };
  }

  try {
    // Fetch both ERC20 and native balances in parallel
    const [erc20Response, nativeBalance] = await Promise.all([
      fetch(rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "alchemy_getTokenBalances",
          params: [account, tokenAddresses],
        }),
      }),
      fetchNativeBalance(chainId, account, rpcUrl),
    ]);

    logger.debug({
      at: "fetchTokenBalancesForChain",
      message: "Making request to Alchemy API for ERC20 tokens",
      chainId,
      account,
      rpcUrl,
    });

    if (!erc20Response.ok) {
      logger.warn({
        at: "fetchTokenBalancesForChain",
        message: "HTTP error from Alchemy API, returning empty balances",
        chainId,
        status: erc20Response.status,
        statusText: erc20Response.statusText,
      });
      return {
        chainId,
        balances: [],
      };
    }

    const data = await erc20Response.json();

    logger.debug({
      at: "fetchTokenBalancesForChain",
      message: "Received response from Alchemy API",
      chainId,
      responseData: data,
    });

    // Validate the response structure
    if (!data || !data.result || !data.result.tokenBalances) {
      logger.warn({
        at: "fetchTokenBalancesForChain",
        message: "Invalid response from Alchemy API, returning empty balances",
        chainId,
        responseData: data,
      });
      return {
        chainId,
        balances: [],
      };
    }

    const erc20Balances = (
      data.result.tokenBalances as {
        contractAddress: string;
        tokenBalance: string;
      }[]
    )
      .filter((t) => {
        if (!t.tokenBalance) return false;
        try {
          const balance = BigNumber.from(t.tokenBalance);
          // Filter out zero balances and MaxUint256 (Alchemy sometimes borks and returns MaxUint256)
          return balance.gt(0) && balance.lt(ethers.constants.MaxUint256);
        } catch (error) {
          logger.warn({
            at: "fetchTokenBalancesForChain",
            message: "Invalid token balance value",
            chainId,
            tokenAddress: t.contractAddress,
            tokenBalance: t.tokenBalance,
          });
          return false;
        }
      })
      .map((t) => ({
        address: t.contractAddress,
        balance: BigNumber.from(t.tokenBalance).toString(),
      }));

    // Add native balance if it exists and is greater than 0
    const balances = [...erc20Balances];
    if (nativeBalance && BigNumber.from(nativeBalance).gt(0)) {
      balances.unshift({
        address: ethers.constants.AddressZero,
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
      message:
        "Error fetching token balances from Alchemy API, returning empty balances",
      chainId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      chainId,
      balances: [],
    };
  }
};

export const handleUserTokenBalances = async (account: string) => {
  // Check if the account is a Solana address
  const isSolanaAddress = isSvmAddress(account);

  if (isSolanaAddress) {
    // For SVM addresses, fetch all SVM chain balances
    logger.debug({
      at: "handleUserTokenBalances",
      message: "Detected SVM address, fetching SVM balances",
      account,
    });

    const svmChainIds = getSvmChainIds();

    // Fetch swap tokens to get the list of token addresses for each chain
    const swapTokens = await getSwapTokens();

    logger.debug({
      at: "handleUserTokenBalances",
      message: "Fetched swap tokens for SVM",
      tokenCount: swapTokens.length,
    });

    // Fetch balances for all SVM chains in parallel
    const balancePromises = svmChainIds.map((chainId) => {
      const tokenAddresses = getSvmTokenAddressesForChain(swapTokens, chainId);
      logger.debug({
        at: "handleUserTokenBalances",
        message: "Token addresses for SVM chain",
        chainId,
        tokenAddressCount: tokenAddresses.length,
      });
      return fetchSolanaTokenBalances(chainId, account, tokenAddresses);
    });

    const chainBalances = await Promise.all(balancePromises);

    return {
      account,
      balances: chainBalances.map(({ chainId, balances }) => ({
        chainId: chainId.toString(),
        balances,
      })),
    };
  }

  // For EVM addresses, fetch all EVM chain balances
  logger.debug({
    at: "handleUserTokenBalances",
    message: "Detected EVM address, fetching EVM balances",
    account,
  });

  // Get all available EVM chain IDs that have Alchemy RPC URLs
  const chainIdsAvailable = getEvmChainIds();

  // Fetch swap tokens to get the list of token addresses for each chain
  const swapTokens = await getSwapTokens();

  logger.debug({
    at: "handleUserTokenBalances",
    message: "Fetched swap tokens",
    tokenCount: swapTokens.length,
  });

  // Fetch balances for all chains in parallel
  const balancePromises = chainIdsAvailable.map((chainId) => {
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
