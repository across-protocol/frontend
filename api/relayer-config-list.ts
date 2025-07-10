import { VercelResponse } from "@vercel/node";
import { Infer, type } from "superstruct";
import { getLogger, handleErrorCondition } from "./_utils";
import { TypedVercelRequest } from "./_types";
import { redisCache } from "./_cache";

const RelayerConfigBodySchema = type({});

type RelayerConfigBody = Infer<typeof RelayerConfigBodySchema>;

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
    // get all configs from redis

    const configs = await redisCache.getAll("relayer-config*");

    logger.debug({
      at: "RelayerConfigList",
      message: "Response data",
      responseJson: configs,
    });
    response.status(200).json(configs);
  } catch (error: unknown) {
    return handleErrorCondition("relayer-config", response, logger, error);
  }
};

export default handler;
