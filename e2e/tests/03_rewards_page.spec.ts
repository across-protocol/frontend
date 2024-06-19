import { test, expect } from "@playwright/test";
import { metaMaskFixtures, testWithSynpress } from "@synthetixio/synpress";

import { E2E_DAPP_URL } from "../config";
import connectedSetup from "../wallet-setup/connected.setup";

const testWithConnectedMM = testWithSynpress(metaMaskFixtures(connectedSetup));
const { expect: expectWithConnectedMM } = testWithConnectedMM;

const rewardsPageUrl = E2E_DAPP_URL + "/rewards";

test("renders correctly /rewards - disconnected", async ({ page }) => {
  await page.goto(rewardsPageUrl);

  await expect(page.getByText(/All pools/)).toBeVisible({
    timeout: 30_000,
  });
});

testWithConnectedMM(
  "renders correctly /rewards - connected",
  async ({ page, metamask }) => {
    await metamask.switchNetwork("Ethereum Mainnet");

    await page.goto(rewardsPageUrl);

    await expectWithConnectedMM(page.getByText(/All pools/)).toBeVisible({
      timeout: 30_000,
    });
  }
);
