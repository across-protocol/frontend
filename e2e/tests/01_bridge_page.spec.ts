import { test, expect } from "@playwright/test";
import { metaMaskFixtures, testWithSynpress } from "@synthetixio/synpress";

import { E2E_DAPP_URL } from "../config";
import connectedSetup from "../wallet-setup/connected.setup";

const testWithConnectedMM = testWithSynpress(metaMaskFixtures(connectedSetup));
const { expect: expectWithConnectedMM } = testWithConnectedMM;

test("renders correctly /bridge - disconnected", async ({ page }) => {
  await page.goto(E2E_DAPP_URL + "/bridge");

  await expect(page.getByTestId("bridge-amount-input")).toBeVisible();
  await expect(page.getByTestId("connect-wallet")).toBeVisible();
});

testWithConnectedMM(
  "renders correctly /bridge - connected",
  async ({ page, metamask }) => {
    await metamask.switchNetwork("Ethereum Mainnet");

    await page.goto(E2E_DAPP_URL + "/bridge");

    await expectWithConnectedMM(
      page.getByRole("button", { name: "Confirm transaction" })
    ).toBeVisible();
  }
);
