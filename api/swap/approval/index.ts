import { VercelResponse } from "@vercel/node";

import { TypedVercelRequest } from "../../_types";
import { getLogger, handleErrorCondition, Profiler } from "../../_utils";
import { BaseSwapQueryParams } from "../_utils";
import { handleApprovalSwap } from "./_service";

const handler = async (
  request: TypedVercelRequest<BaseSwapQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Swap/approval",
    message: "Query data",
    query: request.query,
  });
  try {
    const profiler = new Profiler({
      at: "swap/approval",
      logger: console,
    });
    const mark = profiler.start("e2e endpoint runtime");

    const responseJson = await handleApprovalSwap(request);

    mark.stop();
    logger.debug({
      at: "Swap/approval",
      message: "Response data",
      responseJson,
    });
    response.status(200).json(responseJson);
  } catch (error: unknown) {
    return handleErrorCondition("swap/approval", response, logger, error);
  }
};

export default handler;
