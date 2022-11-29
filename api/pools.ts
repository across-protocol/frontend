import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { isString } from "./_typeguards";
import { PoolInputRequest } from "./_types";

import {
  getLogger,
  InputError,
  getHubPoolClient,
  handleErrorCondition,
} from "./_utils";

const handler = async (
  { query: { token } }: PoolInputRequest,
  response: VercelResponse
) => {
  const logger = getLogger();
  try {
    const hubPoolClient = await getHubPoolClient();

    if (!isString(token))
      throw new InputError("Must provide token as query param");

    token = ethers.utils.getAddress(token);

    await hubPoolClient.updatePool(token);
    let poolState = hubPoolClient.getPoolState(token);

    poolState.estimatedApr = Number(poolState.estimatedApr).toFixed(18);
    poolState.estimatedApy = Number(poolState.estimatedApy).toFixed(18);

    // Instruct Vercel to cache limit data for this token for 5 minutes. Caching can be used to limit number of
    // Vercel invocations and run time for this serverless function and trades off potential inaccuracy in times of
    // high volume. "max-age=0" instructs browsers not to cache, while s-maxage instructs Vercel edge caching
    // to cache the responses and invalidate when deployments update.
    response.setHeader("Cache-Control", "s-maxage=300");
    response.status(200).json(poolState);
  } catch (error: unknown) {
    return handleErrorCondition("pools", response, logger, error);
  }
};

export default handler;
