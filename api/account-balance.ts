import { VercelResponse } from "@vercel/node";
import { assert, Infer, optional, type, min, integer } from "superstruct";
import { TypedVercelRequest } from "./_types";
import {
  getBalance,
  getLogger,
  handleErrorCondition,
  validAddress,
} from "./_utils";

const AccountBalanceQueryParamsSchema = type({
  token: optional(validAddress()),
  account: validAddress(),
  chainId: min(integer(), 1),
  blockTag: optional(min(integer(), 0)),
});

type AccountBalanceQueryParams = Infer<typeof AccountBalanceQueryParamsSchema>;

const handler = async (
  { query }: TypedVercelRequest<AccountBalanceQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "AccountBalance",
    message: "Query data",
    query,
  });
  try {
    // Validate the query parameters
    assert(query, AccountBalanceQueryParamsSchema);
    // Deconstruct the query parameters
    let { token, account, chainId, blockTag } = query;
    // Rely on the utils to query the balance of either the native
    // token or an ERC20 token.
    const balance = await getBalance(chainId, account, token, blockTag);
    // Package the response
    const result = {
      balance: balance.toString(),
      account: account,
      token: token,
      isNative: token === undefined,
      tag: blockTag,
    };
    // Determine the age of the caching of the response
    // 1. If the blockTag is specified, then we can cache for 5 minutes (300 seconds)
    // 2. If the blockTag is not specified, the "latest" block is used, and we should
    //    only cache for 10 seconds.
    const cachingTime = blockTag ? 300 : 10;
    // Log the response
    logger.debug({
      at: "AccountBalance",
      message: "Response data",
      responseJson: result,
      secondsCached: cachingTime,
    });
    // Set the caching headers that will be used by the CDN.
    response.setHeader(
      "Cache-Control",
      `s-maxage=${cachingTime}, stale-while-revalidate=${cachingTime}}`
    );
    // Return the response
    response.status(200).json(result);
  } catch (error: unknown) {
    return handleErrorCondition("account-balance", response, logger, error);
  }
};

export default handler;
