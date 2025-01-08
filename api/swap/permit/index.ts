import { VercelResponse } from "@vercel/node";
import { BigNumber } from "ethers";
import { assert, Infer, optional, type } from "superstruct";

import { TypedVercelRequest } from "../../_types";
import { getLogger, handleErrorCondition, positiveIntStr } from "../../_utils";
import { getCrossSwapQuotes } from "../../_dexes/cross-swap-service";
import {
  handleBaseSwapQueryParams,
  BaseSwapQueryParams,
  buildBaseSwapResponseJson,
} from "../_utils";
import { getSwapRouter02Strategy } from "../../_dexes/uniswap/swap-router-02";
import { InvalidParamError } from "../../_errors";
import { buildPermitTxPayload } from "./_utils";
import { QuoteFetchStrategies } from "../../_dexes/utils";
import { GAS_SPONSOR_ADDRESS } from "../../relay/_utils";
import { getBalance } from "../../_erc20";

export const PermitSwapQueryParamsSchema = type({
  permitDeadline: optional(positiveIntStr()),
});

export type PermitSwapQueryParams = Infer<typeof PermitSwapQueryParamsSchema>;

const DEFAULT_PERMIT_DEADLINE =
  Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365; // 1 year

// For permit-based flows, we have to use the `SpokePoolPeriphery` as an entry point
const quoteFetchStrategies: QuoteFetchStrategies = {
  default: getSwapRouter02Strategy("SpokePoolPeriphery"),
};

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

    if (permitDeadline < Math.floor(Date.now() / 1000)) {
      throw new InvalidParamError({
        message:
          "Permit deadline must be a UNIX timestamp (seconds) in the future",
        param: "permitDeadline",
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
    // Build tx for permit
    const crossSwapTxForPermit = await buildPermitTxPayload({
      crossSwapQuotes,
      permitDeadline,
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
      permitSwapTx: crossSwapTxForPermit,
      inputAmount: amount,
      bridgeQuote: crossSwapQuotes.bridgeQuote,
      originSwapQuote: crossSwapQuotes.originSwapQuote,
      destinationSwapQuote: crossSwapQuotes.destinationSwapQuote,
      refundToken,
      balance,
      // Allowance does not matter for permit-based flows
      allowance: BigNumber.from(0),
    });

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
