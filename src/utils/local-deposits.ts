import { Deposit } from "../hooks/useDeposits";

const LOCAL_DEPOSITS_KEY = "local-deposits";

export function addLocalDeposit(newDeposit: Deposit) {
  const localPendingDeposits = getLocalDeposits();
  const filteredLocalPendingDeposits = localPendingDeposits.filter(
    (deposit) => deposit.depositTxHash !== newDeposit.depositTxHash
  );
  window.localStorage.setItem(
    LOCAL_DEPOSITS_KEY,
    JSON.stringify([newDeposit, ...filteredLocalPendingDeposits])
  );
}

export function getLocalDeposits() {
  const localPendingDeposits = window.localStorage.getItem(LOCAL_DEPOSITS_KEY);
  return (
    localPendingDeposits ? JSON.parse(localPendingDeposits) : []
  ) as Deposit[];
}

export function getLocalDepositByTxHash(depositTxHash: string) {
  const localPendingDeposits = getLocalDeposits();
  return localPendingDeposits.find(
    (deposit) => deposit.depositTxHash === depositTxHash
  );
}

export function removeLocalDeposits(depositTxHashes: string[]) {
  const localPendingDeposits = getLocalDeposits();
  const filteredLocalPendingDeposits = localPendingDeposits.filter(
    (deposit) => !depositTxHashes.includes(deposit.depositTxHash)
  );
  window.localStorage.setItem(
    LOCAL_DEPOSITS_KEY,
    JSON.stringify(filteredLocalPendingDeposits)
  );
}
