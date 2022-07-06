import { useEffect } from "react";
import ReactTooltip from "react-tooltip";

import { useConnection } from "state/hooks";
import { useReferrals } from "hooks/useReferrals";
import { useReferralSummary } from "hooks/useReferralSummary";

export const useRewardsView = () => {
  const { isConnected, account } = useConnection();
  const { referrals } = useReferrals(account || "");
  const { summary, isLoading: isReferalSummaryLoading } = useReferralSummary(
    account || ""
  );

  useEffect(() => {
    ReactTooltip.rebuild();
  });

  return {
    referralsSummary: summary,
    isReferalSummaryLoading,
    isConnected,
    account,
    referrals,
  };
};
