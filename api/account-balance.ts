import { VercelResponse } from "@vercel/node";
import { assert, Infer, type, string } from "superstruct";
import { TypedVercelRequest } from "./_types";
import {
  getBalance,
  getLogger,
  handleErrorCondition,
  validAddress,
} from "./_utils";

const AccountBalanceQueryParamsSchema = type({
  token: validAddress(),
  account: validAddress(),
  chainId: string(),
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
    let { token, account, chainId } = query;
    // Rely on the utils to query the balance of the account for the token
    const balance = await getBalance(chainId, account, token);
    // Package the response
    const result = {
      balance: balance.toString(),
      account: account,
      token: token,
    };
    // Log the response
    logger.debug({
      at: "AccountBalance",
      message: "Response data",
      responseJson: result,
    });
    // Set the caching headers that will be used by the CDN.
    response.setHeader(
      "Cache-Control",
      "s-maxage=150, stale-while-revalidate=150"
    );
    // Return the response
    response.status(200).json(result);
  } catch (error: unknown) {
    return handleErrorCondition("account-balance", response, logger, error);
  }
};

export default handler;
