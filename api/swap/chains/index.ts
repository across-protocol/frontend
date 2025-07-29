import { VercelRequest, VercelResponse } from "@vercel/node";

import { getLogger, handleErrorCondition } from "../../_utils";

import mainnetChains from "../../../src/data/chains_1.json";
import { getRequestId, setRequestSpanAttributes } from "../../_request_utils";
import { sendResponse } from "../../_response_utils";
import { tracer, processor } from "../../../instrumentation";

const chains = mainnetChains;

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const logger = getLogger();
  const requestId = getRequestId(request);
  logger.debug({
    at: "swap/chains",
    message: "Request data",
    requestId,
  });
  return tracer.startActiveSpan("swap/chains", async (span) => {
    setRequestSpanAttributes(request, span, requestId);
    try {
      const responseJson = chains.map((chain) => ({
        chainId: chain.chainId,
        name: chain.name,
        publicRpcUrl: chain.publicRpcUrl,
        explorerUrl: chain.explorerUrl,
        logoUrl: chain.logoUrl,
      }));

      logger.debug({
        at: "swap/chains",
        message: "Response data",
        responseJson,
      });
      sendResponse({
        response,
        body: responseJson,
        statusCode: 200,
        requestId,
        cacheSeconds: 60,
        staleWhileRevalidateSeconds: 60,
      });
    } catch (error: unknown) {
      return handleErrorCondition(
        "swap/chains",
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
