import { VercelResponse } from "@vercel/node";
import { waitUntil } from "@vercel/functions";
import { assert, Infer, literal, type } from "superstruct";
import { getLogger, handleErrorCondition } from "../_utils";
import { getRequestId, setRequestSpanAttributes } from "../_request_utils";
import { sendResponse } from "../_response_utils";
import { tracer, processor } from "../../instrumentation";
import { TypedVercelRequest } from "../_types";
import { fetchPendingGaslessDepositsFromCache } from "./_service";

const GaslessQueryParamsSchema = type({
  status: literal("pending"),
});

type GaslessQueryParams = Infer<typeof GaslessQueryParamsSchema>;

export default async function handler(
  request: TypedVercelRequest<GaslessQueryParams>,
  response: VercelResponse
) {
  const logger = getLogger();
  const requestId = getRequestId(request);

  logger.debug({
    at: "gasless",
    message: "Request data",
    requestId,
    method: request.method,
    query: request.query,
  });

  return tracer.startActiveSpan("gasless", async (span) => {
    setRequestSpanAttributes(request, span, requestId);

    try {
      if (request.method !== "GET") {
        response.setHeader("Allow", "GET");
        return response.status(405).json({
          error: "Method Not Allowed",
          message: "Only GET is supported for /api/gasless",
        });
      }

      const { query } = request;
      assert(query, GaslessQueryParamsSchema);

      const { deposits, cleanup } =
        await fetchPendingGaslessDepositsFromCache();

      logger.debug({
        at: "gasless",
        message: "Response data",
        requestId,
        depositCount: deposits.length,
        source: "cache",
      });

      waitUntil(cleanup());

      return sendResponse({
        response,
        body: { deposits },
        statusCode: 200,
        requestId,
        cacheSeconds: 0,
        staleWhileRevalidateSeconds: 0,
      });
    } catch (error: unknown) {
      return handleErrorCondition(
        "gasless",
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
}
