import { VercelResponse } from "@vercel/node";

import { TypedVercelRequest } from "../_types";
import { getLogger, handleErrorCondition } from "../_utils";
import { BaseSwapQueryParams, SwapBody } from "./_utils";
import { handleApprovalSwap } from "./approval/_service";
import { getRequestId } from "../_request_utils";
import { sendResponse } from "../_response_utils";

type SwapFlowType = "approval";

const swapFlowTypeToHandler = {
  approval: handleApprovalSwap,
};

export default async function handler(
  request: TypedVercelRequest<BaseSwapQueryParams, SwapBody>,
  response: VercelResponse
) {
  const logger = getLogger();
  const requestId = getRequestId(request);
  logger.debug({
    at: "Swap",
    message: "Query data",
    query: request.query,
    requestId,
  });
  try {
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
    sendResponse({
      response,
      body: enrichedResponseJson,
      statusCode: 200,
      requestId,
    });
  } catch (error: unknown) {
    return handleErrorCondition(
      "swap",
      response,
      logger,
      error,
      undefined,
      requestId
    );
  }
}
