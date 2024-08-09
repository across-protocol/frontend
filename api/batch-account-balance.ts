import { VercelResponse } from "@vercel/node";
import {
  assert,
  Infer,
  type,
  string,
  array,
  literal,
  union,
} from "superstruct";
import { TypedVercelRequest } from "./_types";
import {
  callViaMulticall3,
  getLogger,
  getProvider,
  handleErrorCondition,
  validAddress,
} from "./_utils";
import { ERC20__factory } from "@across-protocol/contracts";

const BatchAccountBalanceQueryParamsSchema = type({
  tokenAddress: union([literal("native"), validAddress()]), // can be 0x00 address, ie native
  addresses: array(validAddress()),
  chainId: string(),
});

type BatchAccountBalanceQueryParams = Infer<
  typeof BatchAccountBalanceQueryParamsSchema
>;

export type BatchAccountBalanceResponse = Record<string, string>;

const handler = async (
  { query }: TypedVercelRequest<BatchAccountBalanceQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "BatchAccountBalance",
    message: "Query data",
    query,
  });
  try {
    // Validate the query parameters
    assert(query, BatchAccountBalanceQueryParamsSchema);
    // Deconstruct the query parameters
    let { tokenAddress, addresses, chainId } = query;
    const chainIdAsInt = parseInt(chainId);

    let balances: BatchAccountBalanceResponse = {};

    const provider = getProvider(chainIdAsInt);

    if (tokenAddress === "native") {
      // 1. if token address is native, map native balance calls
      const res = await Promise.all(
        addresses.map((a) => provider.getBalance(a, "latest"))
      );
      addresses.forEach(
        (address, i) => (balances[address] = res[i].toString())
      );
    } else {
      // 2. if token address is erc20, map token balance calls
      const multicalls = addresses.map((address) => {
        const erc20Contract = ERC20__factory.connect(tokenAddress, provider);
        return {
          contract: erc20Contract,
          functionName: "balanceOf",
          args: [address],
        };
      });

      // 3. batch through multicall
      const res = await callViaMulticall3(provider, multicalls, {
        blockTag: "latest",
      });
      addresses.forEach(
        (address, i) => (balances[address] = res[i].toString())
      );
    }

    // Log the response
    logger.debug({
      at: "BatchAccountBalance",
      message: "Response data",
      responseJson: balances,
    });
    // Set the caching headers that will be used by the CDN.
    response.setHeader(
      "Cache-Control",
      "s-maxage=150, stale-while-revalidate=150"
    );
    // Return the response
    response.status(200).json(balances);
  } catch (error: unknown) {
    return handleErrorCondition(
      "batch-account-balance",
      response,
      logger,
      error
    );
  }
};

export default handler;
