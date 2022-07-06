import { useEffect, useState, useMemo } from "react";
import ReactTooltip from "react-tooltip";

import { useConnection } from "state/hooks";
import { useReferrals } from "hooks/useReferrals";
import { useReferralSummary } from "hooks/useReferralSummary";
const DEFAULT_PAGE_SIZE = 5;

export const useRewardsView = () => {
  const { isConnected, account } = useConnection();
  const { referrals } = useReferrals(account || "");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const pageSizes = useMemo(() => [5, 10, 25, 50], []);
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
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pageSizes,
  };
};
