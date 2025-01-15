import { assert, Infer, optional, type } from "superstruct";
import { BigNumber } from "ethers";
import * as sdk from "@across-protocol/sdk";

import { TypedVercelRequest } from "../../_types";
import { positiveIntStr } from "../../_utils";
import { getCrossSwapQuotes } from "../../_dexes/cross-swap-service";
import {
  handleBaseSwapQueryParams,
  BaseSwapQueryParams,
  buildBaseSwapResponseJson,
} from "../_utils";
import { getSwapRouter02Strategy } from "../../_dexes/uniswap/swap-router-02";
import { InvalidParamError } from "../../_errors";
import { QuoteFetchStrategies } from "../../_dexes/utils";
import { buildAuthTxPayload } from "./_utils";
import { GAS_SPONSOR_ADDRESS } from "../../relay/_utils";
import { getBalance } from "../../_erc20";

export const AuthSwapQueryParamsSchema = type({
  authDeadline: optional(positiveIntStr()),
});

export type AuthSwapQueryParams = Infer<typeof AuthSwapQueryParamsSchema>;

const DEFAULT_AUTH_DEADLINE = sdk.utils.getCurrentTime() + 60 * 60 * 24 * 365; // 1 year

// For auth-based flows, we have to use the `SpokePoolPeriphery` as an entry point
const quoteFetchStrategies: QuoteFetchStrategies = {
  default: getSwapRouter02Strategy("SpokePoolPeriphery"),
};

export async function handleAuthSwap(
  request: TypedVercelRequest<BaseSwapQueryParams & AuthSwapQueryParams>
) {
  const {
    authDeadline: _authDeadline,
    authStart: _authStart,
    ...restQuery
  } = request.query;
  assert(
    {
      authDeadline: _authDeadline,
    },
    AuthSwapQueryParamsSchema
  );
  const authDeadline = Number(_authDeadline ?? DEFAULT_AUTH_DEADLINE);
  const authStart = Number(_authStart ?? sdk.utils.getCurrentTime());

  if (authDeadline < Math.floor(Date.now() / 1000)) {
    throw new InvalidParamError({
      message: "auth deadline must be a UNIX timestamp (seconds) in the future",
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
    refundToken,
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
  const crossSwapTxForAuth = await buildAuthTxPayload({
    crossSwapQuotes,
    authDeadline,
    authStart,
    // FIXME: Calculate proper fees
    submissionFees: {
      amount: "0",
      recipient: GAS_SPONSOR_ADDRESS,
    },
  });

  const balance = await getBalance({
    chainId: inputToken.chainId,
    tokenAddress: inputToken.address,
    owner: crossSwapQuotes.crossSwap.depositor,
  });

  const responseJson = buildBaseSwapResponseJson({
    inputTokenAddress: inputToken.address,
    originChainId: inputToken.chainId,
    permitSwapTx: crossSwapTxForAuth,
    inputAmount: amount,
    bridgeQuote: crossSwapQuotes.bridgeQuote,
    originSwapQuote: crossSwapQuotes.originSwapQuote,
    destinationSwapQuote: crossSwapQuotes.destinationSwapQuote,
    refundToken,
    balance,
    // Allowance does not matter for auth-based flows
    allowance: BigNumber.from(0),
  });

  return responseJson;
}
