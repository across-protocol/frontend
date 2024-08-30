import { VercelResponse } from "@vercel/node";
import { assert, Infer, type, string } from "superstruct";
import { TypedVercelRequest } from "./_types";
import {
  getBalance,
  getCachedLatestBlock,
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
    assert(query, AccountBalanceQueryParamsSchema);

    let { token, account, chainId } = query;

    const latestBlock = await getCachedLatestBlock(Number(chainId), 10);

    const balance = await getBalance(
      chainId,
      account,
      token,
      latestBlock.number
    );
    const result = {
      balance: balance.toString(),
      account: account,
      token: token,
    };
    logger.debug({
      at: "AccountBalance",
      message: "Response data",
      responseJson: result,
    });
    response.setHeader(
      "Cache-Control",
      "s-maxage=60, stale-while-revalidate=60"
    );
    response.status(200).json(result);
  } catch (error: unknown) {
    return handleErrorCondition("account-balance", response, logger, error);
  }
};

export default handler;
