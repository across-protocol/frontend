import { useState, useMemo } from "react";

import { useConnection } from "state/hooks";
import { useReferrals } from "hooks/useReferrals";
import { useReferralSummary } from "hooks/useReferralSummary";
const DEFAULT_PAGE_SIZE = 10;

export const useRewardsView = () => {
  const { isConnected, account } = useConnection();
  const { referrals } = useReferrals(account || "");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const pageSizes = useMemo(() => [10, 25, 50], []);
  const { summary, isLoading: isReferalSummaryLoading } = useReferralSummary(
    account || ""
  );

  return {
    referralsSummary: summary,
    isReferalSummaryLoading,
    isConnected,
    account,
    referrals,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pageSizes,
  };
};
