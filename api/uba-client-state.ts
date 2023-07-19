import { VercelResponse } from "@vercel/node";
import { object, Infer } from "superstruct";

import {
  handleErrorCondition,
  getWinstonLogger,
  getRedisClient,
} from "./_utils";
import { REDIS_LATEST_UBA_CLIENTS_STATE_KEY } from "./_constants";
import { TypedVercelRequest } from "./_types";

const UBAClientStateQueryParamsSchema = object({});

type AvailableRoutesQueryParams = Infer<typeof UBAClientStateQueryParamsSchema>;

const handler = async (
  { query }: TypedVercelRequest<AvailableRoutesQueryParams>,
  response: VercelResponse
) => {
  const logger = getWinstonLogger();
  logger.debug({
    at: "UBABundleState",
    message: "Query data",
    query,
  });

  try {
    const redisClient = getRedisClient();
    await redisClient.connect();

    const latestUBAClientState = await redisClient.get(
      REDIS_LATEST_UBA_CLIENTS_STATE_KEY
    );

    if (!latestUBAClientState) {
      throw new Error("No UBA client state found in Redis");
    }

    const serializedUBAState = JSON.parse(latestUBAClientState);

    // Explanation on how `s-maxage` and `stale-while-revalidate` work together:
    //
    // `s-maxage=X` indicates that the response remains fresh until X seconds after the response is generated.
    // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#response_directives
    //
    // `stale-while-revalidate=Y` indicates that the response can be used stale for Y seconds after it becomes stale.
    // At the same time, a revalidation request will be made in the background to populate the cache with a fresh value.
    // See https://vercel.com/docs/concepts/edge-network/caching#stale-while-revalidate
    logger.debug({
      at: "UBAClientState",
      message: "Response data",
      responseJson: serializedUBAState,
    });
    response.setHeader(
      "Cache-Control",
      "s-maxage=120, stale-while-revalidate=180"
    );
    response.status(200).json(serializedUBAState);
  } catch (error: unknown) {
    return handleErrorCondition("uba-client-state", response, logger, error);
  }
};

export default handler;
