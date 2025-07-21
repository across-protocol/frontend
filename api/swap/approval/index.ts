import { VercelResponse } from "@vercel/node";
import { SpanStatusCode } from "@opentelemetry/api";

import { TypedVercelRequest } from "../../_types";
import { getLogger, handleErrorCondition, InputError } from "../../_utils";
import { AcrossErrorCode } from "../../_errors";
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
      // This handler supports both GET and POST requests.
      // For GET requests, we expect the body to be empty.
      // TODO: Allow only POST requests
      if (request.method !== "POST" && request.body) {
        throw new InputError({
          message: "POST method required when request.body is provided",
          code: AcrossErrorCode.INVALID_METHOD,
        });
      }
      const responseJson = await handleApprovalSwap(request);

      logger.debug({
        at: "Swap/approval",
        message: "Response data",
        responseJson,
      });
      span.setAttribute("swap.type", responseJson.crossSwapType);
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
