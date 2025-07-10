import { VercelResponse } from "@vercel/node";
import { assert, Infer, type } from "superstruct";
import { getLogger, handleErrorCondition } from "./_utils";
import { TypedVercelRequest } from "./_types";

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

    logger.debug({
      at: "RelayerConfigList",
      message: "Response data",
      responseJson: [],
    });
    response.status(201).json([]);
  } catch (error: unknown) {
    return handleErrorCondition("relayer-config", response, logger, error);
  }
};

export default handler;
