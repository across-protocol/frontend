import { VercelResponse } from "@vercel/node";
import { getLogger, handleErrorCondition } from "./_utils";
import { TypedVercelRequest } from "./_types";
import { RelayerConfigCacheEntry } from "./relayer/_types";
import { redisCache } from "./_cache";

const handler = async (
  request: TypedVercelRequest<Record<string, never>>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "RelayerConfig",
    message: "Body data",
    body: request.body,
  });
  try {
    const relayerConfigs =
      await redisCache.getAll<RelayerConfigCacheEntry>("relayer-config*");

    logger.debug({
      at: "RelayerConfigList",
      message: "Response data",
      responseJson: relayerConfigs,
    });
    response.status(200).json(relayerConfigs);
  } catch (error: unknown) {
    return handleErrorCondition("relayer-config", response, logger, error);
  }
};

export default handler;
