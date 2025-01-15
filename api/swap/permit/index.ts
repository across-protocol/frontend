import { VercelResponse } from "@vercel/node";
import { Infer, optional, type } from "superstruct";

import { TypedVercelRequest } from "../../_types";
import { getLogger, handleErrorCondition, positiveIntStr } from "../../_utils";
import { BaseSwapQueryParams } from "../_utils";
import { handlePermitSwap } from "./_service";

export const PermitSwapQueryParamsSchema = type({
  permitDeadline: optional(positiveIntStr()),
});

export type PermitSwapQueryParams = Infer<typeof PermitSwapQueryParamsSchema>;

const handler = async (
  request: TypedVercelRequest<BaseSwapQueryParams & PermitSwapQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Swap/permit",
    message: "Query data",
    query: request.query,
  });
  try {
    const responseJson = await handlePermitSwap(request);

    logger.debug({
      at: "Swap/permit",
      message: "Response data",
      responseJson,
    });
    response.status(200).json(responseJson);
  } catch (error: unknown) {
    return handleErrorCondition("swap/permit", response, logger, error);
  }
};

export default handler;
