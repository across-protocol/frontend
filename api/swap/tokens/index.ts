import { VercelResponse } from "@vercel/node";
import { type, assert, Infer, optional, array, union } from "superstruct";

import {
  getLogger,
  handleErrorCondition,
  paramToArray,
  positiveIntStr,
} from "../../_utils";
import { TypedVercelRequest } from "../../_types";

import { getRequestId, setRequestSpanAttributes } from "../../_request_utils";
import { sendResponse } from "../../_response_utils";
import { tracer, processor } from "../../../instrumentation";
import { fetchSwapTokensData, SwapToken } from "./_service";

const SwapTokensQueryParamsSchema = type({
  chainId: optional(union([positiveIntStr(), array(positiveIntStr())])),
});

type SwapTokensQueryParams = Infer<typeof SwapTokensQueryParamsSchema>;

export default async function handler(
  request: TypedVercelRequest<SwapTokensQueryParams>,
  response: VercelResponse
) {
  const logger = getLogger();
  const requestId = getRequestId(request);
  logger.debug({
    at: "swap/tokens",
    message: "Request data",
    requestId,
  });
  return tracer.startActiveSpan("swap/tokens", async (span) => {
    setRequestSpanAttributes(request, span, requestId);

    try {
      const { query } = request;
      assert(query, SwapTokensQueryParamsSchema);

      const { chainId } = query;
      const filteredChainIds = chainId
        ? paramToArray(chainId)?.map(Number)
        : undefined;

      const responseJson: SwapToken[] =
        await fetchSwapTokensData(filteredChainIds);

      logger.debug({
        at: "swap/tokens",
        message: "Response data",
        responseJson,
      });
      sendResponse({
        response,
        body: responseJson,
        statusCode: 200,
        requestId,
        cacheSeconds: 60 * 5,
        staleWhileRevalidateSeconds: 60 * 5,
      });
    } catch (error: unknown) {
      return handleErrorCondition(
        "swap/tokens",
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
