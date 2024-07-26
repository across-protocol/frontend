import { Page } from "@playwright/test";

export async function selectChain(
  page: Page,
  fromOrTo: "from" | "to",
  chainLabel: string | RegExp
) {
  const selectorTestId = `${fromOrTo}-chain-select`;
  return selectFromSelector(page, selectorTestId, chainLabel);
}

export async function selectToken(
  page: Page,
  inputOrOutput: "input" | "output",
  tokenLabel: string | RegExp
) {
  const selectorTestId = `${inputOrOutput}-token-select`;
  return selectFromSelector(page, selectorTestId, tokenLabel);
}

async function selectFromSelector(
  page: Page,
  selectorTestId: string,
  itemLabel: string | RegExp
) {
  const selectorModal = page.getByTestId(`${selectorTestId}-modal`);
  const item = page
    .getByText(itemLabel, { exact: true })
    .filter({
      hasNot: page.getByRole("link"),
    })
    .first();

  await page.getByTestId(selectorTestId).click();
  await selectorModal.locator(item).scrollIntoViewIfNeeded();
  await selectorModal.locator(item).click();
}
