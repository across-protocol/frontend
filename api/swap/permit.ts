import { VercelResponse } from "@vercel/node";

import { TypedVercelRequest } from "../_types";
import { getLogger, handleErrorCondition } from "../_utils";
import { getCrossSwapTxForPermit } from "../_dexes/cross-swap";
import { handleBaseSwapQueryParams, BaseSwapQueryParams } from "./_utils";

const handler = async (
  request: TypedVercelRequest<BaseSwapQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Swap/permit",
    message: "Query data",
    query: request.query,
  });
  try {
    const { crossSwapQuotes } = await handleBaseSwapQueryParams(request);

    const permitDeadline = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365; // 1 year

    const crossSwapTxForPermit = await getCrossSwapTxForPermit(
      crossSwapQuotes,
      permitDeadline
    );

    const responseJson = crossSwapTxForPermit;

    logger.debug({
      at: "Swap/permit",
      message: "Response data",
      responseJson,
    });
    response.status(200).json(responseJson);
  } catch (error: unknown) {
    return handleErrorCondition("swap/permit", response, logger, error);
  }
};

export default handler;
