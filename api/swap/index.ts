import { VercelResponse } from "@vercel/node";

import { TypedVercelRequest } from "../_types";
import { getLogger, handleErrorCondition } from "../_utils";
import { handleBaseSwapQueryParams, BaseSwapQueryParams } from "./_utils";
import { handleApprovalSwap } from "./approval/_service";

type SwapFlowType = "approval";

const swapFlowTypeToHandler = {
  approval: handleApprovalSwap,
};

export default async function handler(
  request: TypedVercelRequest<BaseSwapQueryParams>,
  response: VercelResponse
) {
  const logger = getLogger();
  logger.debug({
    at: "Swap",
    message: "Query data",
    query: request.query,
  });
  try {
    // `/swap` only validate shared base params
    await handleBaseSwapQueryParams(request.query);

    // TODO: Enable other swap flow types in the future
    const swapFlowType = "approval";

    const handler = swapFlowTypeToHandler[swapFlowType as SwapFlowType];
    const responseJson = await handler(request);
    const enrichedResponseJson = {
      ...responseJson,
      swapFlowType,
    };

    logger.debug({
      at: "Swap",
      message: "Response data",
      responseJson: enrichedResponseJson,
    });
    response.status(200).json(enrichedResponseJson);
  } catch (error: unknown) {
    return handleErrorCondition("swap", response, logger, error);
  }
}
