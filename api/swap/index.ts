import { VercelResponse } from "@vercel/node";

import { TypedVercelRequest } from "../_types";
import { getLogger, handleErrorCondition } from "../_utils";
import { handleBaseSwapQueryParams, BaseSwapQueryParams } from "./_utils";
import { handleApprovalSwap } from "./approval/_service";
import { handlePermitSwap } from "./_permit/_service";
import { handleAuthSwap } from "./_auth/_service";

type SwapFlowType = "permit" | "transfer-with-auth" | "approval";

const swapFlowTypeToHandler = {
  permit: handlePermitSwap,
  "transfer-with-auth": handleAuthSwap,
  approval: handleApprovalSwap,
};

export default async function handler(
  request: TypedVercelRequest<BaseSwapQueryParams>,
  response: VercelResponse
) {
  const logger = getLogger();
  logger.debug({
    at: "Swap",
    message: "Query data",
    query: request.query,
  });
  try {
    // `/swap` only validate shared base params
    await handleBaseSwapQueryParams(request.query);

    // TODO: Enable other swap flow types in the future
    const swapFlowType = "approval";
    // Determine swap flow by checking if required args and methods are supported
    // let swapFlowType: SwapFlowType;
    // const args = {
    //   tokenAddress: inputToken.address,
    //   chainId: inputToken.chainId,
    //   ownerAddress: depositor,
    //   spenderAddress: recipient || depositor,
    //   value: amount,
    // };
    // const [permitArgsResult, transferWithAuthArgsResult] =
    //   await Promise.allSettled([
    //     getPermitArgsFromContract(args),
    //     getReceiveWithAuthArgsFromContract(args),
    //   ]);

    // if (permitArgsResult.status === "fulfilled") {
    //   swapFlowType = "permit";
    // } else if (transferWithAuthArgsResult.status === "fulfilled") {
    //   swapFlowType = "transfer-with-auth";
    // } else {
    //   swapFlowType = "approval";
    // }

    const handler = swapFlowTypeToHandler[swapFlowType as SwapFlowType];
    const responseJson = await handler(request);
    const enrichedResponseJson = {
      ...responseJson,
      swapFlowType,
    };

    logger.debug({
      at: "Swap",
      message: "Response data",
      responseJson: enrichedResponseJson,
    });
    response.status(200).json(enrichedResponseJson);
  } catch (error: unknown) {
    return handleErrorCondition("swap", response, logger, error);
  }
}
