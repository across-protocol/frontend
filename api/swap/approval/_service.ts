import { Span } from "@opentelemetry/api";

import { BaseSwapQueryParams, SwapBody } from "../_utils";
import { TypedVercelRequest } from "../../_types";
import { handleSwap } from "../_swap-handler";

export async function handleApprovalSwap(
  request: TypedVercelRequest<BaseSwapQueryParams, SwapBody>,
  span?: Span
) {
  return handleSwap({
    request,
    span,
    flow: "approval",
    buildOriginTx: async (context) =>
      context.bridgeStrategy.buildTxForAllowanceHolder({
        quotes: context.crossSwapQuotes,
        integratorId: context.baseParams.integratorId,
      }),
  });
}
