import { VercelResponse } from "@vercel/node";

import { TypedVercelRequest } from "../_types";
import { getLogger, handleErrorCondition } from "../_utils";
import { getCrossSwapTxForTransferWithAuthorization } from "../_dexes/cross-swap";
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

    const expiration = Date.now() + 60 * 60 * 24 * 365; // 1 year from now

    const crossSwapTxForTransferWithAuthorization =
      await getCrossSwapTxForTransferWithAuthorization(
        crossSwapQuotes,
        expiration
      );

    const responseJson = crossSwapTxForTransferWithAuthorization;

    logger.debug({
      at: "Swap/transfer-with-authorization",
      message: "Response data",
      responseJson,
    });
    response.status(200).json(responseJson);
  } catch (error: unknown) {
    return handleErrorCondition(
      "swap/transfer-with-authorization",
      response,
      logger,
      error
    );
  }
};

export default handler;
