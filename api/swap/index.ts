import { VercelResponse } from "@vercel/node";
import axios from "axios";

import { TypedVercelRequest } from "../_types";
import {
  getLogger,
  handleErrorCondition,
  resolveVercelEndpoint,
} from "../_utils";
import { handleBaseSwapQueryParams, BaseSwapQueryParams } from "./_utils";
import { getPermitArgsFromContract } from "../_permit";
import { getReceiveWithAuthArgsFromContract } from "../_transfer-with-auth";

type SwapFlowType = "permit" | "transfer-with-auth" | "approval";

function makeSwapHandler(path: string) {
  return (params: unknown) =>
    axios.get(`${resolveVercelEndpoint(true)}/api/swap/${path}`, { params });
}
const swapFlowTypeToHandler = {
  permit: makeSwapHandler("permit"),
  "transfer-with-auth": makeSwapHandler("auth"),
  approval: makeSwapHandler("approval"),
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
    const { inputToken, amount, recipient, depositor } =
      await handleBaseSwapQueryParams(request.query);

    // Determine swap flow by checking if required args and methods are supported
    let swapFlowType: SwapFlowType;
    const args = {
      tokenAddress: inputToken.address,
      chainId: inputToken.chainId,
      ownerAddress: depositor,
      spenderAddress: recipient || depositor,
      value: amount,
    };
    const [permitArgsResult, transferWithAuthArgsResult] =
      await Promise.allSettled([
        getPermitArgsFromContract(args),
        getReceiveWithAuthArgsFromContract(args),
      ]);

    if (permitArgsResult.status === "fulfilled") {
      swapFlowType = "permit";
    } else if (transferWithAuthArgsResult.status === "fulfilled") {
      swapFlowType = "transfer-with-auth";
    } else {
      swapFlowType = "approval";
    }

    const handler = swapFlowTypeToHandler[swapFlowType];
    const { data } = await handler(request.query);
    const enrichedResponseJson = {
      ...data,
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
