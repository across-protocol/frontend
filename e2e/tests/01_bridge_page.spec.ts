import { test, expect } from "@playwright/test";
import { metaMaskFixtures, testWithSynpress } from "@synthetixio/synpress";

import { E2E_DAPP_URL } from "../config";
import connectedSetup from "../wallet-setup/connected.setup";

const testWithConnectedMM = testWithSynpress(metaMaskFixtures(connectedSetup));
const { expect: expectWithConnectedMM } = testWithConnectedMM;

test("renders correctly /bridge - disconnected", async ({ page }) => {
  await page.goto(E2E_DAPP_URL + "/bridge-and-swap");
  // Wait for the page to be fully loaded
  await page.waitForLoadState("networkidle");

  // Check some text items
  await expect(page.getByText("From")).toBeVisible({ timeout: 10000 });

  // Wait for the input to be visible using the ID selector (more reliable)
  await page.waitForSelector("#origin-amount-input", {
    state: "visible",
    timeout: 5000,
  });

  // Wait for the input to be visible using the ID selector (more reliable)
  await page.waitForSelector("#origin-token-selector", {
    state: "visible",
    timeout: 5000,
  });

  // Wait for the input to be visible using the ID selector (more reliable)
  await page.waitForSelector("#destination-amount-input", {
    state: "visible",
    timeout: 5000,
  });

  // Wait for the input to be visible using the ID selector (more reliable)
  await page.waitForSelector("#destination-token-selector", {
    state: "visible",
    timeout: 5000,
  });

  // The connect wallet button shows "Connect wallet" text
  const connectWalletButton = page.getByTestId("wallet-connect-button");
  await expect(connectWalletButton).toBeVisible();
  await expect(connectWalletButton).toHaveText("Connect");

  // The bridge button should also show "Connect wallet" text when not connected
  const bridgeButton = page.getByTestId("bridge-button");
  await expect(bridgeButton).toBeVisible();
  await expect(bridgeButton).toHaveText("Connect Wallet");
});

testWithConnectedMM(
  "renders correctly /bridge - connected",
  async ({ page, metamask }) => {
    await metamask.switchNetwork("Ethereum Mainnet");

    await page.goto(E2E_DAPP_URL + "/bridge-and-swap");
    // Wait for the page to be fully loaded
    await page.waitForLoadState("networkidle");

    // The button text changed from "Confirm transaction" to "Confirm Swap"
    await expectWithConnectedMM(
      page.getByRole("button", { name: "Enter an amount to continue" })
    ).toBeVisible({ timeout: 10000 });
  }
);
