import { VercelResponse } from "@vercel/node";
import { assert, Infer, type } from "superstruct";
import { TypedVercelRequest } from "./_types";
import { getLogger, handleErrorCondition, validAddress } from "./_utils";
import { getAlchemyRpcFromConfigJson } from "./_providers";
import { MAINNET_CHAIN_IDs } from "@across-protocol/constants";
import { BigNumber } from "ethers";

const UserTokenBalancesQueryParamsSchema = type({
  account: validAddress(),
});

type UserTokenBalancesQueryParams = Infer<
  typeof UserTokenBalancesQueryParamsSchema
>;

const fetchTokenBalancesForChain = async (
  chainId: number,
  account: string
): Promise<{
  chainId: number;
  balances: Array<{ address: string; balance: string }>;
}> => {
  const rpcUrl = getAlchemyRpcFromConfigJson(chainId);

  if (!rpcUrl) {
    throw new Error(`No Alchemy RPC URL found for chain ${chainId}`);
  }

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getTokenBalances",
      params: [account],
    }),
  });

  const data = await response.json();

  const balances = (
    data.result.tokenBalances as {
      contractAddress: string;
      tokenBalance: string;
    }[]
  )
    .filter((t) => !!t.tokenBalance && BigNumber.from(t.tokenBalance).gt(0))
    .map((t) => ({
      address: t.contractAddress,
      balance: BigNumber.from(t.tokenBalance).toString(),
    }));

  return {
    chainId,
    balances,
  };
};

const handler = async (
  request: TypedVercelRequest<UserTokenBalancesQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();

  try {
    const { query } = request;
    assert(query, UserTokenBalancesQueryParamsSchema);
    const { account } = query;

    // Get all available chain IDs that have Alchemy RPC URLs
    const chainIdsAvailable = Object.values(MAINNET_CHAIN_IDs)
      .sort((a, b) => a - b)
      .filter((chainId) => !!getAlchemyRpcFromConfigJson(chainId));

    // Fetch balances for all chains in parallel
    const balancePromises = chainIdsAvailable.map((chainId) =>
      fetchTokenBalancesForChain(chainId, account)
    );

    const chainBalances = await Promise.all(balancePromises);

    const responseData = {
      account,
      balances: chainBalances.map(({ chainId, balances }) => ({
        chainId: chainId.toString(),
        balances,
      })),
    };

    logger.debug({
      at: "UserTokenBalances",
      message: "Response data",
      responseJson: responseData,
    });

    // Cache for 3 minutes
    response.setHeader(
      "Cache-Control",
      "s-maxage=180, stale-while-revalidate=60"
    );
    response.status(200).json(responseData);
  } catch (error: unknown) {
    return handleErrorCondition("user-token-balances", response, logger, error);
  }
};

export default handler;
