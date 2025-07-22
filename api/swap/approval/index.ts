import { VercelResponse } from "@vercel/node";
import { Span, SpanStatusCode } from "@opentelemetry/api";

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
      const responseJson = await handleApprovalSwap(request);

      logger.debug({
        at: "Swap/approval",
        message: "Response data",
        responseJson,
      });
      setSpanAttributes(span, responseJson);
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

function setSpanAttributes(
  span: Span,
  responseJson: Awaited<ReturnType<typeof handleApprovalSwap>>
) {
  span.setAttribute("swap.type", responseJson.crossSwapType);
  span.setAttribute("swap.tradeType", responseJson.amountType);
  span.setAttribute("swap.originChainId", responseJson.inputToken.chainId);
  span.setAttribute(
    "swap.destinationChainId",
    responseJson.outputToken.chainId
  );
  span.setAttribute("swap.inputToken.address", responseJson.inputToken.address);
  span.setAttribute("swap.inputToken.symbol", responseJson.inputToken.symbol);
  span.setAttribute("swap.inputToken.chainId", responseJson.inputToken.chainId);
  span.setAttribute(
    "swap.outputToken.address",
    responseJson.outputToken.address
  );
  span.setAttribute("swap.outputToken.symbol", responseJson.outputToken.symbol);
  span.setAttribute(
    "swap.outputToken.chainId",
    responseJson.outputToken.chainId
  );
  span.setAttribute("swap.inputAmount", responseJson.inputAmount.toString());
  span.setAttribute(
    "swap.minOutputAmount",
    responseJson.minOutputAmount.toString()
  );
  span.setAttribute(
    "swap.expectedOutputAmount",
    responseJson.expectedOutputAmount.toString()
  );
}

export default handler;
