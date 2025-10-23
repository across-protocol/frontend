import { VercelResponse } from "@vercel/node";
import { assert, Infer, type } from "superstruct";
import { TypedVercelRequest } from "../_types";
import { getLogger, handleErrorCondition, validAddress } from "../_utils";
import { handleUserTokenBalances } from "./_service";

const UserTokenBalancesQueryParamsSchema = type({
  account: validAddress(),
});

type UserTokenBalancesQueryParams = Infer<
  typeof UserTokenBalancesQueryParamsSchema
>;

const handler = async (
  request: TypedVercelRequest<UserTokenBalancesQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();

  try {
    const { query } = request;
    assert(query, UserTokenBalancesQueryParamsSchema);
    const { account } = query;

    const responseData = await handleUserTokenBalances(account);

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
