import { VercelResponse } from "@vercel/node";
import { assert, Infer } from "superstruct";
import { getLogger, handleErrorCondition } from "./_utils";
import { TypedVercelRequest } from "./_types";
import { RelayerConfigSchema } from "./relayer/_types";
import { buildCacheKey, redisCache } from "./_cache";

type RelayerConfigBody = Infer<typeof RelayerConfigSchema>;

const handler = async (
  request: TypedVercelRequest<RelayerConfigBody>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "RelayerConfig",
    message: "Body data",
    body: request.body,
  });
  try {
    const { body, method } = request;
    logger.info({
      at: "RelayerConfig",
      message: "processing",
      body: request.body,
    });
    if (method !== "POST") {
      return handleErrorCondition(
        "relayer-config",
        response,
        logger,
        new Error("Method not allowed")
      );
    }

    assert(body, RelayerConfigSchema);

    // TODO: validate authentication

    // store config in redis
    const config: any = body;
    config.updatedAt = new Date().getTime();

    const cacheKey = buildCacheKey(
      "relayer-config",
      body.authentication.address
    );
    await redisCache.set(cacheKey, config, 60 * 60 * 24 * 2);
    const storedConfig = await redisCache.get(cacheKey);

    logger.debug({
      at: "RelayerConfig",
      message: "Response data",
      responseJson: storedConfig,
    });
    response.status(201).json(storedConfig);
  } catch (error: unknown) {
    return handleErrorCondition("relayer-config", response, logger, error);
  }
};

export default handler;
