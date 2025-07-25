import { VercelResponse } from "@vercel/node";
import { SpanStatusCode } from "@opentelemetry/api";

import { TypedVercelRequest } from "../../_types";
import { getLogger, handleErrorCondition } from "../../_utils";
import { BaseSwapQueryParams, SwapBody } from "../_utils";
import { handleApprovalSwap } from "./_service";
import { getRequestId } from "../../_request_utils";
import { sendResponse } from "../../_response_utils";
import { tracer } from "../../../instrumentation";

const handler = async (
  request: TypedVercelRequest<BaseSwapQueryParams, SwapBody>,
  response: VercelResponse
) => {
  const logger = getLogger();
  const requestId = getRequestId(request);
  logger.debug({
    at: "Swap/approval",
    message: "Query data",
    query: request.query,
    requestId,
  });
  return tracer.startActiveSpan("swap/approval", async (span) => {
    try {
      span.setAttribute("http.request_id", requestId);

      const responseJson = await handleApprovalSwap(request, span);

      logger.debug({
        at: "Swap/approval",
        message: "Response data",
        responseJson,
      });

      span.setStatus({ code: SpanStatusCode.OK });

      sendResponse({
        response,
        body: responseJson,
        statusCode: 200,
        requestId,
      });
    } catch (error: unknown) {
      return handleErrorCondition(
        "swap/approval",
        response,
        logger,
        error,
        span,
        requestId
      );
    } finally {
      span.end();
    }
  });
};

export default handler;
