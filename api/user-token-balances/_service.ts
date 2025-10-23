import { BigNumber, ethers } from "ethers";
import { MAINNET_CHAIN_IDs } from "@across-protocol/constants";
import { getLogger } from "../_utils";
import { getAlchemyRpcFromConfigJson } from "../_providers";

const logger = getLogger();

const fetchNativeBalance = async (
  chainId: number,
  account: string,
  rpcUrl: string
): Promise<string | null> => {
  try {
    const requestBody = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBalance",
      params: [account, "latest"],
    };

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
      body: JSON.stringify(requestBody),
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

export const fetchTokenBalancesForChain = async (
  chainId: number,
  account: string
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
          params: [account], // TODO: explicitly add token addresses for each chain
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
  // Get all available chain IDs that have Alchemy RPC URLs
  const chainIdsAvailable = Object.values(MAINNET_CHAIN_IDs)
    .sort((a, b) => a - b)
    .filter((chainId) => !!getAlchemyRpcFromConfigJson(chainId));

  // Fetch balances for all chains in parallel
  const balancePromises = chainIdsAvailable.map((chainId) =>
    fetchTokenBalancesForChain(chainId, account)
  );

  const chainBalances = await Promise.all(balancePromises);

  return {
    account,
    balances: chainBalances.map(({ chainId, balances }) => ({
      chainId: chainId.toString(),
      balances,
    })),
  };
};
