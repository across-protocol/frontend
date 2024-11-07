import { VercelResponse } from "@vercel/node";
import { assert, Infer, type, string, optional } from "superstruct";

import { TypedVercelRequest } from "./_types";
import {
  getLogger,
  handleErrorCondition,
  positiveFloatStr,
  positiveIntStr,
  validAddress,
  boolStr,
} from "./_utils";

const SwapQueryParamsSchema = type({
  minOutputAmount: positiveIntStr(),
  inputToken: validAddress(),
  outputToken: validAddress(),
  originChainId: positiveIntStr(),
  destinationChainId: positiveIntStr(),
  recipient: validAddress(),
  integratorId: string(),
  refundAddress: optional(validAddress()),
  refundOnOrigin: optional(boolStr()),
  slippageTolerance: optional(positiveFloatStr(50)), // max. 50% slippage
});

type SwapQueryParams = Infer<typeof SwapQueryParamsSchema>;

const handler = async (
  { query }: TypedVercelRequest<SwapQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Swap",
    message: "Query data",
    query,
  });
  try {
    assert(query, SwapQueryParamsSchema);

    let {
      inputToken,
      outputToken,
      minOutputAmount,
      originChainId,
      destinationChainId,
      recipient,
      integratorId,
      refundAddress,
      refundOnOrigin,
      slippageTolerance = "0.5", // Default to 0.5% slippage
    } = query;

    // 1. Get auxiliary data
    // - Swap type: major to major (same), major to major (different), major to any, any to major, any to any
    // - Token details
    // - Token prices

    // 2. Get swap quotes and calldata based on the swap type

    // 3. Get suggested fees with message and input amount

    // 4. Build tx and return

    logger.debug({
      at: "Swap",
      message: "Response data",
      responseJson: {},
    });
    response.status(200).json({});
  } catch (error: unknown) {
    return handleErrorCondition("swap", response, logger, error);
  }
};

export default handler;
