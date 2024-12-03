import { VercelResponse } from "@vercel/node";
import { assert, Infer, optional, type } from "superstruct";

import { TypedVercelRequest } from "../_types";
import { getLogger, handleErrorCondition, positiveIntStr } from "../_utils";
import { getCrossSwapTxForPermit } from "../_dexes/cross-swap";
import { handleBaseSwapQueryParams, BaseSwapQueryParams } from "./_utils";

export const PermitSwapQueryParamsSchema = type({
  permitDeadline: optional(positiveIntStr()),
});

export type PermitSwapQueryParams = Infer<typeof PermitSwapQueryParamsSchema>;

const DEFAULT_PERMIT_DEADLINE =
  Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365; // 1 year

const handler = async (
  request: TypedVercelRequest<BaseSwapQueryParams & PermitSwapQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Swap/permit",
    message: "Query data",
    query: request.query,
  });
  try {
    // `/swap/permit` specific params validation
    const { permitDeadline: _permitDeadline, ...restQuery } = request.query;
    assert(
      {
        permitDeadline: _permitDeadline,
      },
      PermitSwapQueryParamsSchema
    );
    const permitDeadline = Number(_permitDeadline ?? DEFAULT_PERMIT_DEADLINE);

    // `/swap` specific params validation + quote generation
    const { crossSwapQuotes } = await handleBaseSwapQueryParams(restQuery);

    // Build tx for permit
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
