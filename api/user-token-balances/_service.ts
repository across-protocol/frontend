import { MAINNET_CHAIN_IDs } from "@across-protocol/constants";
import * as sdk from "@across-protocol/sdk";
import { getLogger } from "../_utils";
import { getAlchemyRpcFromConfigJson } from "../_providers";
import { isSvmAddress } from "../_address";
import { fetchSwapTokensData, SwapToken } from "../swap/tokens/_service";
import { CHAIN_IDs, EVM_CHAIN_IDs } from "../_constants";
import * as evmService from "./_evm";
import * as svmService from "./_svm";

const logger = getLogger();

async function getSwapTokens(
  filteredChainIds?: number[]
): Promise<SwapToken[]> {
  try {
    return await fetchSwapTokensData(filteredChainIds);
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
    const swapTokens = await getSwapTokens([CHAIN_IDs.SOLANA]);

    logger.debug({
      at: "handleUserTokenBalances",
      message: "Fetched swap tokens for SVM",
      tokenCount: swapTokens.length,
    });

    // Fetch balances for all SVM chains in parallel
    const balancePromises = svmChainIds.map((chainId) => {
      const tokenAddresses = svmService.getSvmTokenAddressesForChain(
        swapTokens,
        chainId
      );
      logger.debug({
        at: "handleUserTokenBalances",
        message: "Token addresses for SVM chain",
        chainId,
        tokenAddressCount: tokenAddresses.length,
      });
      return svmService.fetchTokenBalancesForChain(
        chainId,
        account,
        tokenAddresses
      );
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
  const swapTokens = await getSwapTokens(EVM_CHAIN_IDs);

  logger.debug({
    at: "handleUserTokenBalances",
    message: "Fetched swap tokens",
    tokenCount: swapTokens.length,
  });

  // Fetch balances for all chains in parallel
  const balancePromises = chainIdsAvailable.map((chainId) => {
    const tokenAddresses = evmService.getTokenAddressesForChain(
      swapTokens,
      chainId
    );
    logger.debug({
      at: "handleUserTokenBalances",
      message: "Token addresses for chain",
      chainId,
      tokenAddressCount: tokenAddresses.length,
    });
    return evmService.fetchTokenBalancesForChain(
      chainId,
      account,
      tokenAddresses
    );
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
