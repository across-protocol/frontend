import { Deposit } from "../hooks/useDeposits";

const LOCAL_DEPOSITS_KEY = "local-deposits-v2";
const LOCAL_DEPOSIT_TTL = 24 * 60 * 60 * 1000; // 24 hours

type LocalDepositEntry = {
  deposit: Deposit;
  ttl: number;
  createdAt: number;
};

export function addLocalDeposit(newDeposit: Deposit) {
  const localPendingDeposits = getLocalDepositEntries();
  const filteredLocalPendingDeposits = localPendingDeposits.filter(
    ({ deposit }) => deposit.depositTxHash !== newDeposit.depositTxHash
  );
  const newDepositEntry: LocalDepositEntry = {
    deposit: newDeposit,
    ttl: LOCAL_DEPOSIT_TTL,
    createdAt: Date.now(),
  };
  window.localStorage.setItem(
    LOCAL_DEPOSITS_KEY,
    JSON.stringify([newDepositEntry, ...filteredLocalPendingDeposits])
  );
}

export function getLocalDepositEntries() {
  const localPendingDepositsRaw =
    window.localStorage.getItem(LOCAL_DEPOSITS_KEY);
  const localPendingDeposits = (
    localPendingDepositsRaw ? JSON.parse(localPendingDepositsRaw) : []
  ) as LocalDepositEntry[];

  const now = Date.now();
  const localDepositsToKeep = localPendingDeposits.filter(
    (localDeposit) => localDeposit.createdAt + localDeposit.ttl >= now
  );
  window.localStorage.setItem(
    LOCAL_DEPOSITS_KEY,
    JSON.stringify(localDepositsToKeep)
  );

  return localDepositsToKeep;
}

export function getLocalDepositByTxHash(depositTxHash: string) {
  const localPendingDeposits = getLocalDepositEntries();
  return localPendingDeposits.find(
    ({ deposit }) => deposit.depositTxHash === depositTxHash
  )?.deposit;
}

export function removeLocalDeposits(depositTxHashes: string[]) {
  const localPendingDeposits = getLocalDepositEntries();
  const filteredLocalPendingDeposits = localPendingDeposits.filter(
    ({ deposit }) => !depositTxHashes.includes(deposit.depositTxHash)
  );
  window.localStorage.setItem(
    LOCAL_DEPOSITS_KEY,
    JSON.stringify(filteredLocalPendingDeposits)
  );
}
