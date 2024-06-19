import { Page } from "@playwright/test";
import {
  metaMaskFixtures,
  testWithSynpress,
  MetaMask,
} from "@synthetixio/synpress";

import { selectChain, selectToken } from "../utils/bridge-page";
import { chains, IS_CI } from "../config";
import connectedSetup from "../wallet-setup/connected.setup";
import {
  tokenAmountsMap,
  depositChainIdToTest,
  originRoutesToTest,
  destinationChainIdsToTest,
  destinationRoutesToTest,
} from "../utils/deposit-test-routes";

const testWithConnectedMM = testWithSynpress(metaMaskFixtures(connectedSetup));
const { expect } = testWithConnectedMM;

// This needs to be sequential because we are sending txsn from the same origin chain
testWithConnectedMM(
  `deposits from ${depositChainIdToTest} to ${destinationChainIdsToTest}`,
  async ({ page, metamask }) => {
    if (IS_CI) {
      testWithConnectedMM.skip();
    }
    for (const { toChain } of originRoutesToTest) {
      await testDepositFlow(
        depositChainIdToTest,
        [toChain],
        tokenAmountsMap,
        page,
        metamask as any
      );
    }
  }
);

// These can be parallel because they are sending txns from different origin chains
for (const originChainId of Object.keys(destinationRoutesToTest)) {
  const toChainIds = destinationRoutesToTest[Number(originChainId)].map(
    ({ toChain }) => toChain
  );
  testWithConnectedMM(
    `deposits from ${originChainId} to ${Array.from(new Set(toChainIds))}`,
    async ({ page, metamask }) => {
      if (IS_CI) {
        testWithConnectedMM.skip();
      }
      await testDepositFlow(
        Number(originChainId),
        toChainIds,
        tokenAmountsMap,
        page,
        metamask as any
      );
    }
  );
}

async function testDepositFlow(
  fromChainId: number,
  toChainIds: number[],
  tokenAmounts: Record<string, number>,
  page: Page,
  metamask: MetaMask
) {
  const fromChain = chains[fromChainId];

  await metamask.addNetwork({
    name: fromChain.name,
    rpcUrl: fromChain.rpcUrl,
    chainId: fromChainId,
    symbol: "ETH",
  });
  await metamask.switchNetwork(fromChain.name);

  // Select route in following order:
  // 1. origin chain
  // 2. destination chain
  // 3. input token
  await selectChain(page, "from", new RegExp(`${fromChain.name}`));

  for (const toChainId of toChainIds) {
    const toChain = chains[toChainId];
    await selectChain(page, "to", new RegExp(`${toChain.name}`));

    for (const [symbol, amount] of Object.entries(tokenAmounts)) {
      await selectToken(page, "input", symbol);

      // Disabled if input is empty
      await expect(page.getByTestId("bridge-button")).toBeDisabled({
        timeout: 15_000,
      });

      // Enter amount
      await page.getByTestId("bridge-amount-input").clear();
      await page.waitForTimeout(1000);
      await page.getByTestId("bridge-amount-input").fill(String(amount));

      // Wait for GET /suggested-fees to resolve
      await page.waitForResponse(
        (response) => {
          return response.url().includes("/suggested-fees");
        },
        {
          timeout: 20_000,
        }
      );

      // Enabled if input is not empty
      await expect(page.getByTestId("bridge-button")).toBeEnabled({
        timeout: 15_000,
      });

      // Send deposit tx
      await page.getByTestId("bridge-button").click();
      await page.waitForTimeout(1000);
      await metamask.confirmTransaction();

      // Wait for deposit tx to be mined
      await expect(page.getByText(/Filling on destination chain/)).toBeVisible({
        timeout: 60_000,
      });

      // Init go back to bridge page
      const initNewTxButton = page.getByRole("button", {
        name: /Initiate new transaction/,
      });
      await initNewTxButton.scrollIntoViewIfNeeded();
      await initNewTxButton.click();
    }
  }
}
