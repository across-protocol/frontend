import { useConnection } from "hooks";
import { Deposit, useUserDeposits } from "hooks/useDeposits";
import { useMemo, useState } from "react";

export function useGenericRewardProgram(
  depositFilter: (deposit: Deposit) => boolean
) {
  const { account } = useConnection();
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data } = useUserDeposits("filled", pageSize, offset, account);
  const deposits = useMemo(
    () => (data?.deposits ?? []).filter((d) => depositFilter(d) && !!d.rewards),
    [data?.deposits, depositFilter]
  );

  return {
    deposits,
    offset,
    setOffset,
    pageSize,
    setPageSize,
  };
}
