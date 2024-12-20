import { VercelResponse } from "@vercel/node";
import { assert, Infer, optional, type } from "superstruct";

import { TypedVercelRequest } from "../../_types";
import { getLogger, handleErrorCondition, positiveIntStr } from "../../_utils";
import { getCrossSwapQuotes } from "../../_dexes/cross-swap-service";
import { handleBaseSwapQueryParams, BaseSwapQueryParams } from "../_utils";
import { getSwapRouter02Strategy } from "../../_dexes/uniswap/swap-router-02";
import { InvalidParamError } from "../../_errors";
import { QuoteFetchStrategies } from "../../_dexes/utils";
import { buildAuthTxPayload } from "./_utils";

export const authSwapQueryParamsSchema = type({
  authDeadline: optional(positiveIntStr()),
});

export type authSwapQueryParams = Infer<typeof authSwapQueryParamsSchema>;

const DEFAULT_AUTH_DEADLINE =
  Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365; // 1 year

// For auth-based flows, we have to use the `SpokePoolPeriphery` as an entry point
const quoteFetchStrategies: QuoteFetchStrategies = {
  default: getSwapRouter02Strategy("SpokePoolPeriphery"),
};

const handler = async (
  request: TypedVercelRequest<BaseSwapQueryParams & authSwapQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Swap/auth",
    message: "Query data",
    query: request.query,
  });
  try {
    // `/swap/auth` specific params validation
    const {
      authDeadline: _authDeadline,
      authStart: _authStart,
      ...restQuery
    } = request.query;
    assert(
      {
        authDeadline: _authDeadline,
      },
      authSwapQueryParamsSchema
    );
    const authDeadline = Number(_authDeadline ?? DEFAULT_AUTH_DEADLINE);
    const authStart = Number(_authStart ?? Date.now());

    if (authDeadline < Math.floor(Date.now() / 1000)) {
      throw new InvalidParamError({
        message:
          "auth deadline must be a UNIX timestamp (seconds) in the future",
        param: "authDeadline",
      });
    }

    // `/swap` specific params validation + quote generation
    const {
      isInputNative,
      isOutputNative,
      inputToken,
      outputToken,
      amount,
      amountType,
      refundOnOrigin,
      refundAddress,
      recipient,
      depositor,
      slippageTolerance,
    } = await handleBaseSwapQueryParams(restQuery);

    const crossSwapQuotes = await getCrossSwapQuotes(
      {
        amount,
        inputToken,
        outputToken,
        depositor,
        recipient: recipient || depositor,
        slippageTolerance: Number(slippageTolerance),
        type: amountType,
        refundOnOrigin,
        refundAddress,
        isInputNative,
        isOutputNative,
      },
      quoteFetchStrategies
    );
    // Build tx for auth
    const crossSwapTxForAuth = await buildAuthTxPayload(
      crossSwapQuotes,
      authDeadline,
      authStart
    );

    const responseJson = crossSwapTxForAuth;

    logger.debug({
      at: "Swap/auth",
      message: "Response data",
      responseJson,
    });
    response.status(200).json(responseJson);
  } catch (error: unknown) {
    return handleErrorCondition("swap/auth", response, logger, error);
  }
};

export default handler;
