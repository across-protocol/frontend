import { VercelResponse } from "@vercel/node";
import { object, assert, Infer, enums, optional } from "superstruct";

import { TypedVercelRequest } from "./_types";

import {
  getLogger,
  handleErrorCondition,
  validAddress,
  getPoolState,
} from "./_utils";

const PoolsQueryParamsSchema = object({
  token: validAddress(),
  externalPoolProvider: optional(enums(["balancer"])),
  user: optional(validAddress()),
});

type PoolsQueryParams = Infer<typeof PoolsQueryParamsSchema>;

const handler = async (
  { query }: TypedVercelRequest<PoolsQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Pools",
    message: "Query data",
    query,
  });
  try {
    assert(query, PoolsQueryParamsSchema);

    const { token, externalPoolProvider } = query;

    const poolState = await getPoolState(token, externalPoolProvider);

    // Instruct Vercel to cache limit data for this token for 5 minutes. Caching can be used to limit number of
    // Vercel invocations and run time for this serverless function and trades off potential inaccuracy in times of
    // high volume. "max-age=0" instructs browsers not to cache, while s-maxage instructs Vercel edge caching
    // to cache the responses and invalidate when deployments update.
    logger.debug({
      at: "Pools",
      message: "Response data",
      responseJson: poolState,
    });
    response.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=300"
    );
    response.status(200).json(poolState);
  } catch (error: unknown) {
    return handleErrorCondition("pools", response, logger, error);
  }
};

export default handler;
