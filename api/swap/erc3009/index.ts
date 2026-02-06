import { VercelResponse } from "@vercel/node";

import { TypedVercelRequest } from "../../_types";
import { getLogger, handleErrorCondition } from "../../_utils";
import { BaseSwapQueryParams, SwapBody } from "../_utils";
import { handleErc3009Swap } from "./_service";
import { getRequestId, setRequestSpanAttributes } from "../../_request_utils";
import { sendResponse } from "../../_response_utils";
import { tracer, processor } from "../../../instrumentation";
import { ForbiddenError } from "../../_errors";
import { validateApiKey } from "../../_api-keys";
import { extractBearerToken } from "../../_auth";

const handler = async (
  request: TypedVercelRequest<BaseSwapQueryParams, SwapBody>,
  response: VercelResponse
) => {
  const logger = getLogger();
  const requestId = getRequestId(request);
  logger.debug({
    at: "Swap/erc3009",
    message: "Query data",
    query: request.query,
    body: request.body,
    requestId,
  });
  return tracer.startActiveSpan("swap/erc3009", async (span) => {
    try {
      setRequestSpanAttributes(request, span, requestId);

      const apiKey = extractBearerToken(request);
      const apiKeyResult = await validateApiKey(apiKey);
      if (!apiKeyResult?.valid) {
        throw new ForbiddenError({ message: "Invalid or missing API key" });
      }

      const responseJson = await handleErc3009Swap(request, span);

      logger.debug({
        at: "Swap/gasless",
        message: "Response data",
        responseJson,
      });

      sendResponse({
        response,
        body: responseJson,
        statusCode: 200,
        requestId,
      });
    } catch (error: unknown) {
      return handleErrorCondition(
        "swap/erc3009",
        response,
        logger,
        error,
        span,
        requestId
      );
    } finally {
      span.end();
      processor.forceFlush();
    }
  });
};

export default handler;
