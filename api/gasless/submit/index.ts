import { VercelResponse } from "@vercel/node";

import { TypedVercelRequest } from "../../_types";
import { getLogger, handleErrorCondition } from "../../_utils";
import { GaslessSubmitBody } from "./_validation";
import { handleGaslessSubmit } from "./_service";
import { getRequestId, setRequestSpanAttributes } from "../../_request_utils";
import { sendResponse } from "../../_response_utils";
import { tracer, processor } from "../../../instrumentation";
import {
  AcrossApiError,
  ForbiddenError,
  HttpErrorToStatusCode,
} from "../../_errors";
import { validateApiKey } from "../../_api-keys";
import { extractBearerToken } from "../../_auth";

const handler = async (
  request: TypedVercelRequest<Record<string, never>, GaslessSubmitBody>,
  response: VercelResponse
) => {
  const logger = getLogger();
  const requestId = getRequestId(request);

  // Only allow POST method
  if (request.method !== "POST") {
    return sendResponse({
      response,
      body: new AcrossApiError({
        message: "Method not allowed. Use POST.",
        status: HttpErrorToStatusCode.METHOD_NOT_ALLOWED,
        code: "INVALID_METHOD",
      }),
      statusCode: HttpErrorToStatusCode.METHOD_NOT_ALLOWED,
      requestId,
    });
  }

  logger.debug({
    at: "Gasless/submit",
    message: "Request data",
    body: request.body,
    requestId,
  });

  return tracer.startActiveSpan("gasless/submit", async (span) => {
    try {
      setRequestSpanAttributes(request, span, requestId);

      const apiKey = extractBearerToken(request);
      const apiKeyResult = await validateApiKey(apiKey);

      if (!apiKeyResult?.valid) {
        throw new ForbiddenError({
          message: "Invalid API key",
        });
      }

      const responseJson = await handleGaslessSubmit({
        body: request.body,
        requestId,
        apiKeyName: apiKeyResult.name,
        apiKeyPermissions: apiKeyResult.permissions,
      });

      logger.debug({
        at: "Gasless/submit",
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
        "gasless/submit",
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
