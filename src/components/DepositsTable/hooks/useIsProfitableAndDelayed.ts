import { BigNumber, utils } from "ethers";
import { DateTime } from "luxon";

import { Deposit } from "hooks/useDeposits";
import {
  fallbackSuggestedRelayerFeePct,
  suggestedFeesDeviationBufferMultiplier,
  fixedPointAdjustment,
  pendingStateTimeUntilDelayed,
} from "utils";
import { useBridgeLimits } from "hooks";

export function useIsProfitableAndDelayed(deposit: Deposit) {
  const { limits } = useBridgeLimits(
    // disable query for filled deposits
    deposit.status === "pending" ? deposit?.token?.symbol : undefined,
    deposit?.outputToken?.symbol,
    deposit.sourceChainId,
    deposit.destinationChainId
  );

  const isProfitable =
    deposit.status === "pending" &&
    BigNumber.from(
      deposit.suggestedRelayerFeePct || fallbackSuggestedRelayerFeePct
    ).lte(
      BigNumber.from(deposit.depositRelayerFeePct || 0)
        .mul(utils.parseEther(String(suggestedFeesDeviationBufferMultiplier)))
        .div(fixedPointAdjustment)
    );
  const isDelayed =
    deposit.status === "pending" &&
    Math.abs(
      DateTime.fromSeconds(deposit.depositTime).diffNow("seconds").as("seconds")
    ) > pendingStateTimeUntilDelayed &&
    limits
      ? BigNumber.from(deposit.amount).gt(limits?.maxDepositInstant)
      : false;

  return {
    isProfitable,
    isDelayed,
  };
}
