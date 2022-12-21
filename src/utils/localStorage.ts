const TX_HISTORY_PAGE_SIZE_KEY = "txHistoryPageSize";

export function setTxHistoryPageSize(value: number) {
  localStorage.setItem(TX_HISTORY_PAGE_SIZE_KEY, value.toString());
}

export function getTxHistoryPageSize(): number | undefined {
  return localStorage.getItem(TX_HISTORY_PAGE_SIZE_KEY)
    ? Number(localStorage.getItem(TX_HISTORY_PAGE_SIZE_KEY))
    : undefined;
}

export function setAccountSeenWelcomeTravellerFlow(account: string) {
  localStorage.setItem(`accountSeenWelcomeTravellerFlow-${account}`, account);
}

export function getAccountSeenWelcomeTravellerFlow(
  account: string
): string | null {
  return localStorage.getItem(`accountSeenWelcomeTravellerFlow-${account}`);
}

export function setIsFirstTimeUser(value: boolean) {
  return localStorage.setItem("isFirstTimeUser", String(value));
}

export function getIsFirstTimeUser() {
  const value = localStorage.getItem("isFirstTimeUser");

  if (value === null) {
    return true;
  }

  return Boolean(value === "true");
}
