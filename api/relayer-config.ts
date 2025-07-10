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
    const { body, method } = request;

    if (method !== "POST") {
      return handleErrorCondition(
        "relayer-config",
        response,
        logger,
        new Error("Method not allowed")
      );
    }

    assert(body, RelayerConfigBodySchema);

    // TODO: validate authentication

    // store config in redis

    // return stored entity

    logger.debug({
      at: "RelayerConfig",
      message: "Response data",
      responseJson: body,
    });
    response.status(201).json(body);
  } catch (error: unknown) {
    return handleErrorCondition("relayer-config", response, logger, error);
  }
};

export default handler;
