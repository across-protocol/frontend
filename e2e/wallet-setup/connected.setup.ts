import {
  MetaMask,
  defineWalletSetup,
  getExtensionId,
} from "@synthetixio/synpress";

import { MM_PASSWORD, MM_SEED_PHRASE, E2E_DAPP_URL } from "../config";

export default defineWalletSetup(MM_PASSWORD, async (context, walletPage) => {
  // This is a workaround for the fact that the MetaMask extension ID changes.
  // This workaround won't be needed in the near future!
  const extensionId = await getExtensionId(context, "MetaMask");

  const metamask = new MetaMask(context, walletPage, MM_PASSWORD, extensionId);

  await metamask.importWallet(MM_SEED_PHRASE);

  const page = await context.newPage();

  // Go to a locally hosted MetaMask Test Dapp.
  await page.goto(E2E_DAPP_URL);

  // Connect via wallet sidebar
  await page
    .getByRole("banner")
    .locator(page.getByRole("button", { name: "Connect" }))
    .click();
  await page.getByTestId("sidebar-menu-item-MetaMask").click();

  await metamask.connectToDapp(["Account 1"]);
});
