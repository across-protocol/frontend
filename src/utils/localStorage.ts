const TX_HISTORY_PAGE_SIZE_KEY = "txHistoryPageSize";
const PMF_GOOGLE_FORM_ENTERED_KEY = "pmfGoogleFormEntered";

export function setTxHistoryPageSize(value: number) {
  localStorage.setItem(TX_HISTORY_PAGE_SIZE_KEY, value.toString());
}

export function getTxHistoryPageSize(): number | undefined {
  return localStorage.getItem(TX_HISTORY_PAGE_SIZE_KEY)
    ? Number(localStorage.getItem(TX_HISTORY_PAGE_SIZE_KEY))
    : undefined;
}

export function setPMFGoogleFormEntered() {
  localStorage.setItem(PMF_GOOGLE_FORM_ENTERED_KEY, "true");
}

export function getPMFGoogleFormEntered(): boolean {
  return localStorage.getItem(PMF_GOOGLE_FORM_ENTERED_KEY) === "true";
}
