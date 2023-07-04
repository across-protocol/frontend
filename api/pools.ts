import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { object, assert, Infer } from "superstruct";
import { TypedVercelRequest } from "./_types";
// For ESM support import with .js
// See https://www.typescriptlang.org/docs/handbook/esm-node.html
import {
  getLogger,
  getHubPoolClient,
  handleErrorCondition,
  validAddress,
} from "./_utils.js";

const PoolsQueryParamsSchema = object({
  token: validAddress(),
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
    const hubPoolClient = getHubPoolClient();

    assert(query, PoolsQueryParamsSchema);

    const token = ethers.utils.getAddress(query.token);

    await hubPoolClient.updatePool(token);

    // Instruct Vercel to cache limit data for this token for 5 minutes. Caching can be used to limit number of
    // Vercel invocations and run time for this serverless function and trades off potential inaccuracy in times of
    // high volume. "max-age=0" instructs browsers not to cache, while s-maxage instructs Vercel edge caching
    // to cache the responses and invalidate when deployments update.
    logger.debug({
      at: "Pools",
      message: "Response data",
      responseJson: hubPoolClient.getPoolState(token),
    });
    response.setHeader("Cache-Control", "s-maxage=300");
    response.status(200).json(hubPoolClient.getPoolState(token));
  } catch (error: unknown) {
    return handleErrorCondition("pools", response, logger, error);
  }
};

export default handler;
