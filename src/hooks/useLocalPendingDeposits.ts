import { Deposit } from "./useDeposits";

const LOCAL_PENDING_DEPOSITS_KEY = "local-pending-deposits";

export function useLocalPendingDeposits() {
  const addLocalPendingDeposit = (newDeposit: Deposit) => {
    const localPendingDeposits = getLocalPendingDeposits();
    const filteredLocalPendingDeposits = localPendingDeposits.filter(
      (deposit) => deposit.depositTxHash !== newDeposit.depositTxHash
    );
    window.localStorage.setItem(
      LOCAL_PENDING_DEPOSITS_KEY,
      JSON.stringify([newDeposit, ...filteredLocalPendingDeposits])
    );
  };

  const getLocalPendingDeposits = () => {
    const localPendingDeposits = window.localStorage.getItem(
      LOCAL_PENDING_DEPOSITS_KEY
    );
    return (
      localPendingDeposits ? JSON.parse(localPendingDeposits) : []
    ) as Deposit[];
  };

  const removeLocalPendingDeposits = (depositTxHashes: string[]) => {
    const localPendingDeposits = getLocalPendingDeposits();
    const filteredLocalPendingDeposits = localPendingDeposits.filter(
      (deposit) => !depositTxHashes.includes(deposit.depositTxHash)
    );
    window.localStorage.setItem(
      LOCAL_PENDING_DEPOSITS_KEY,
      JSON.stringify(filteredLocalPendingDeposits)
    );
  };

  return {
    addLocalPendingDeposit,
    getLocalPendingDeposits,
    removeLocalPendingDeposits,
  };
}
