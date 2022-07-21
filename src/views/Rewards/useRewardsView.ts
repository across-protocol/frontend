import { useState, useMemo } from "react";

import { useConnection } from "state/hooks";
import { useReferrals } from "hooks/useReferrals";
import { useReferralSummary } from "hooks/useReferralSummary";
const DEFAULT_PAGE_SIZE = 10;

export const useRewardsView = () => {
  const { isConnected, account } = useConnection();
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);

  // Note: we need to reset the page to 0 whenever we change the size to avoid going off the end.
  const setPageSize = (newPageSize: number) => {
    // Reset current page to 0 when resetting the page size.
    setCurrentPage(0);
    setPageSizeState(newPageSize);
  };

  const pageSizes = useMemo(() => [10, 25, 50], []);
  const { referrals, pagination } = useReferrals(
    account,
    pageSize,
    pageSize * currentPage
  );
  const { summary, isLoading: isReferalSummaryLoading } =
    useReferralSummary(account);

  console.log("pageSize", pageSize);
  console.log("total count", summary);
  console.log("current page", currentPage);
  console.log("refs", referrals);

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
    totalReferralCount: pagination.total,
  };
};
