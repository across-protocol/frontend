import { useConnection } from "hooks";
import { useMemo } from "react";
import { useQuery } from "react-query";
import { getToken, rebateTokensAvailable } from "utils";
import { useReferralSummary } from "./useReferralSummary";
import useReferrer from "./useReferrer";

export function useRewardToken(destinationChainId: number) {
  const rewardToken = useMemo(() => {
    if (rebateTokensAvailable.includes("OP")) {
      return getToken(destinationChainId === 10 ? "OP" : "ACX");
    }
    return getToken("ACX");
  }, [destinationChainId]);

  const { account } = useConnection();
  const { referrer } = useReferrer();

  // TODO: Replace with real more efficient hook call
  const { summary: referralSummary } = useReferralSummary(referrer);

  // We don't want to worry about the referrer or account if we're
  // not using the ACX reward token
  const queryKeyAddtlParams =
    rewardToken.symbol === "ACX" ? [referrer, account] : [];

  const availableRewardPercentage = useQuery(
    ["rewards-percentage", rewardToken.symbol, ...queryKeyAddtlParams],
    async () => {
      if (rewardToken.symbol === "OP") {
        return 0.95;
      } else {
        // 100% of rate if referree is the user account, 25% otherwise
        return (
          (referrer === account ? 1.0 : 0.25) * referralSummary.referralRate
        );
      }
    },
    {
      // Enable if OP or (ACX and referrer and referralSummary are defined)
      enabled:
        rewardToken.symbol !== "ACX" || (!!referrer && !!referralSummary),
    }
  );

  return {
    rewardToken,
    ...availableRewardPercentage,
    availableRewardPercentage: availableRewardPercentage.data || undefined,
    isACXRewardToken: rewardToken.symbol === "ACX",
  };
}
