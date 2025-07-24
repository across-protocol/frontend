import { VercelResponse } from "@vercel/node";
import { SpanStatusCode } from "@opentelemetry/api";

import { TypedVercelRequest } from "../../_types";
import { getLogger, handleErrorCondition } from "../../_utils";
import { BaseSwapQueryParams, SwapBody } from "../_utils";
import { handleApprovalSwap } from "./_service";
import { tracer } from "../../../instrumentation";

const handler = async (
  request: TypedVercelRequest<BaseSwapQueryParams, SwapBody>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Swap/approval",
    message: "Query data",
    query: request.query,
  });
  return tracer.startActiveSpan("swap/approval", async (span) => {
    try {
      const responseJson = await handleApprovalSwap(request, span);

      logger.debug({
        at: "Swap/approval",
        message: "Response data",
        responseJson,
      });
      span.setStatus({ code: SpanStatusCode.OK });
      response.status(200).json(responseJson);
    } catch (error: unknown) {
      return handleErrorCondition(
        "swap/approval",
        response,
        logger,
        error,
        span
      );
    } finally {
      span.end();
    }
  });
};

export default handler;
