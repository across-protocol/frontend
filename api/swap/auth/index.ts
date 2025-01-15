import { VercelResponse } from "@vercel/node";

import { TypedVercelRequest } from "../../_types";
import { getLogger, handleErrorCondition } from "../../_utils";
import { BaseSwapQueryParams } from "../_utils";

import { handleAuthSwap, AuthSwapQueryParams } from "./_service";

const handler = async (
  request: TypedVercelRequest<BaseSwapQueryParams & AuthSwapQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Swap/auth",
    message: "Query data",
    query: request.query,
  });
  try {
    const responseJson = await handleAuthSwap(request);

    logger.debug({
      at: "Swap/auth",
      message: "Response data",
      responseJson,
    });
    response.status(200).json(responseJson);
  } catch (error: unknown) {
    return handleErrorCondition("swap/auth", response, logger, error);
  }
};

export default handler;
