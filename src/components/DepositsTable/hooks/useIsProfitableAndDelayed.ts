import { BigNumber, utils } from "ethers";
import { DateTime } from "luxon";

import { Deposit } from "hooks/useDeposits";
import {
  fallbackSuggestedRelayerFeePct,
  suggestedFeesDeviationBufferMultiplier,
  fixedPointAdjustment,
  pendingStateTimeUntilDelayed,
  getConfig,
} from "utils";
import { useBridgeLimits } from "hooks";

const config = getConfig();

export function useIsProfitableAndDelayed(deposit: Deposit) {
  const token = config.getTokenInfoByAddressSafe(
    deposit.sourceChainId,
    deposit.assetAddr
  );

  const { limits } = useBridgeLimits(
    // disable query for filled deposits
    deposit.status === "pending" ? token?.symbol : undefined,
    deposit.sourceChainId,
    deposit.destinationChainId
  );

  const isProfitable = BigNumber.from(
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
