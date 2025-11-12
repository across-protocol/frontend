import { BigNumber, ethers } from "ethers";
import { getLogger } from "../_utils";
import { getAlchemyRpcFromConfigJson } from "../_providers";
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

export async function fetchNativeBalance(
  chainId: number,
  account: string,
  rpcUrl: string
): Promise<string | null> {
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
}

export async function fetchErc20Balances(
  chainId: number,
  account: string,
  tokenAddresses: string[],
  rpcUrl: string
): Promise<Array<{ address: string; balance: string }>> {
  // Early return if no token addresses
  if (tokenAddresses.length === 0) {
    logger.debug({
      at: "fetchErc20Balances",
      message: "No ERC20 token addresses to fetch, returning empty array",
      chainId,
    });
    return [];
  }

  try {
    const response = await fetch(rpcUrl, {
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
    });

    logger.debug({
      at: "fetchErc20Balances",
      message: "Making request to Alchemy API for ERC20 tokens",
      chainId,
      account,
      rpcUrl,
      tokenAddressCount: tokenAddresses.length,
    });

    if (!response.ok) {
      logger.warn({
        at: "fetchErc20Balances",
        message: "HTTP error from Alchemy API, returning empty balances",
        chainId,
        status: response.status,
        statusText: response.statusText,
      });
      return [];
    }

    const data = await response.json();

    logger.debug({
      at: "fetchErc20Balances",
      message: "Received response from Alchemy API",
      chainId,
      responseData: data,
    });

    // Validate the response structure
    if (!data || !data.result || !data.result.tokenBalances) {
      logger.warn({
        at: "fetchErc20Balances",
        message: "Invalid response from Alchemy API, returning empty balances",
        chainId,
        responseData: data,
      });
      return [];
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
            at: "fetchErc20Balances",
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

    return erc20Balances;
  } catch (error) {
    logger.warn({
      at: "fetchErc20Balances",
      message: "Error fetching ERC20 balances from Alchemy API",
      chainId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function fetchTokenBalancesForChain(
  chainId: number,
  account: string,
  tokenAddresses: string[]
): Promise<{
  chainId: number;
  balances: Array<{ address: string; balance: string }>;
}> {
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
    // Separate ERC20 tokens from native token
    const erc20TokenAddresses = tokenAddresses.filter(
      (addr) => addr !== ethers.constants.AddressZero
    );

    logger.debug({
      at: "fetchTokenBalancesForChain",
      message: "Fetching token balances for chain",
      chainId,
      totalTokens: tokenAddresses.length,
      erc20Tokens: erc20TokenAddresses.length,
    });

    // Fetch both ERC20 and native balances in parallel
    const [erc20Balances, nativeBalance] = await Promise.all([
      fetchErc20Balances(chainId, account, erc20TokenAddresses, rpcUrl),
      fetchNativeBalance(chainId, account, rpcUrl),
    ]);

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
}
