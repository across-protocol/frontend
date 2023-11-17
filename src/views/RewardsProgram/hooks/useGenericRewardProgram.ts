import { useConnection } from "hooks";
import { Referral, useReferrals } from "hooks/useReferrals";
import { useEffect, useMemo, useState } from "react";

export function useGenericRewardProgram(
  referralFilter: (referral: Referral) => boolean
) {
  const { account, isConnected } = useConnection();
  const pageSizes = useMemo(() => [10, 25, 50], []);
  const [currentPage, setCurrentPage] = useState(pageSizes[0]);
  const [pageSize, setPageSizeState] = useState(10);

  // Note: we need to reset the page to 0 whenever we change the size to avoid going off the end.
  const setPageSize = (newPageSize: number) => {
    // Reset current page to 0 when resetting the page size.
    setCurrentPage(0);
    setPageSizeState(newPageSize);
  };

  const {
    referrals: _referrals,
    pagination: { total: totalReferrals },
  } = useReferrals(account, pageSize, pageSize * currentPage);

  const referrals = useMemo(
    () => _referrals.filter(referralFilter),
    [_referrals, referralFilter]
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [account]);

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    referrals,
    pageSizes,
    totalReferrals,
    account,
    isConnected,
  };
}
