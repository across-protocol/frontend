import { test, expect } from "@playwright/test";
import { metaMaskFixtures, testWithSynpress } from "@synthetixio/synpress";

import { E2E_DAPP_URL } from "../config";
import connectedSetup from "../wallet-setup/connected.setup";

const testWithConnectedMM = testWithSynpress(metaMaskFixtures(connectedSetup));
const { expect: expectWithConnectedMM } = testWithConnectedMM;

const poolPageUrl = E2E_DAPP_URL + "/pool";

test("renders correctly /pool - disconnected", async ({ page }) => {
  await page.goto(poolPageUrl);

  await expect(page.getByTestId("user-pool-info-box").first()).toBeVisible();
  await expect(page.getByTestId("pool-info-box").first()).toBeVisible();
});

testWithConnectedMM(
  "renders correctly /pool - connected",
  async ({ page, metamask }) => {
    await metamask.switchNetwork("Ethereum Mainnet");

    await page.goto(poolPageUrl);

    await expectWithConnectedMM(
      page.getByRole("button", { name: "Add liquidity" })
    ).toBeVisible();
  }
);
