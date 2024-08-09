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
  getBatchBalanceViaMulticall3,
  getLogger,
  getProvider,
  handleErrorCondition,
  validAddress,
} from "./_utils";

const BatchAccountBalanceQueryParamsSchema = type({
  tokenAddress: union([literal("native"), validAddress()]),
  addresses: array(validAddress()),
  chainId: string(),
});

type BatchAccountBalanceQueryParams = Infer<
  typeof BatchAccountBalanceQueryParamsSchema
>;

export type BatchAccountBalanceResponse = Record<
  BatchAccountBalanceQueryParams["addresses"][number],
  string
>;

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
      // fetch native balances
      const res = await Promise.all(
        addresses.map((a) => provider.getBalance(a, "latest"))
      );
      addresses.forEach(
        (address, i) => (balances[address] = res[i].toString())
      );
    } else {
      // fetch erc20 balances
      const res = await getBatchBalanceViaMulticall3(
        chainId,
        addresses,
        tokenAddress
      );
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
