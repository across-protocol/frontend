import { test, expect } from "@playwright/test";
import { metaMaskFixtures, testWithSynpress } from "@synthetixio/synpress";

import { E2E_DAPP_URL } from "../config";
import connectedSetup from "../wallet-setup/connected.setup";

const testWithConnectedMM = testWithSynpress(metaMaskFixtures(connectedSetup));

const txPageUrl = E2E_DAPP_URL + "/transactions";

test("renders correctly /transactions - disconnected", async ({ page }) => {
  await page.goto(txPageUrl);

  await expect(
    page.getByText(/Please connect your wallet to view transactions/)
  ).toBeVisible();
});

testWithConnectedMM(
  "renders correctly /rewards - connected",
  async ({ page, metamask }) => {
    await metamask.switchNetwork("Ethereum Mainnet");

    await page.goto(txPageUrl);

    await expect(
      page.getByText(/Please connect your wallet to view transactions/)
    ).not.toBeVisible();
  }
);
