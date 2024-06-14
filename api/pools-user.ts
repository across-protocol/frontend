import { VercelResponse } from "@vercel/node";
import { object, assert, Infer } from "superstruct";

import { TypedVercelRequest } from "./_types";

import {
  getLogger,
  handleErrorCondition,
  validAddress,
  getPoolStateForUser,
} from "./_utils";

const PoolsUserQueryParamsSchema = object({
  token: validAddress(),
  user: validAddress(),
});

type PoolsUserQueryParams = Infer<typeof PoolsUserQueryParamsSchema>;

const handler = async (
  { query }: TypedVercelRequest<PoolsUserQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "PoolsUser",
    message: "Query data",
    query,
  });
  try {
    assert(query, PoolsUserQueryParamsSchema);

    const { token, user } = query;

    const poolStateOfUser = await getPoolStateForUser(token, user);

    // Instruct Vercel to cache limit data for this token for 5 minutes. Caching can be used to limit number of
    // Vercel invocations and run time for this serverless function and trades off potential inaccuracy in times of
    // high volume. "max-age=0" instructs browsers not to cache, while s-maxage instructs Vercel edge caching
    // to cache the responses and invalidate when deployments update.
    logger.debug({
      at: "Pools",
      message: "Response data",
      responseJson: poolStateOfUser,
    });
    response.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=300"
    );
    response.status(200).json(poolStateOfUser);
  } catch (error: unknown) {
    return handleErrorCondition("pools-user", response, logger, error);
  }
};

export default handler;
