import { useConnection } from "hooks";
import { useRewards } from "hooks/useRewards";
import { useEffect, useMemo, useState } from "react";
import { rewardProgramTypes } from "utils";

export function useGenericRewardProgram(program: rewardProgramTypes) {
  const { account, isConnected, connect } = useConnection();
  const pageSizes = useMemo(() => [10, 25, 50], []);
  const [currentPage, setCurrentPage] = useState(pageSizes[0]);
  const [pageSize, setPageSizeState] = useState(10);

  // Note: we need to reset the page to 0 whenever we change the size to avoid going off the end.
  const setPageSize = (newPageSize: number) => {
    // Reset current page to 0 when resetting the page size.
    setCurrentPage(0);
    setPageSizeState(newPageSize);
  };

  const rewardsQuery = useRewards(
    program,
    account,
    pageSize,
    pageSize * currentPage
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [account]);

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pageSizes,
    account,
    isConnected,
    connect,
    rewardsQuery,
  };
}
