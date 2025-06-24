import { Wallet } from "ethers";

import { getProvider } from "../../api/_utils";
import { fetchSwapQuotes, signAndWaitAllowanceFlow } from "./_swap-utils";

async function swapWithAllowance() {
  console.log("Swapping with allowance...");
  const swapQuotes = await fetchSwapQuotes("approval");

  if (swapQuotes.length === 0) {
    console.log("No swap quotes found");
    return;
  }

  for (const swapQuote of swapQuotes) {
    if (!swapQuote.swapTx || !("data" in swapQuote.swapTx)) {
      console.log("No swap quote with tx data for approval");
      return;
    }

    console.log("\nSwap quote:", JSON.stringify(swapQuote, null, 2));

    if (!process.env.DEV_WALLET_PK) {
      const wallet = new Wallet(process.env.DEV_WALLET_PK!).connect(
        getProvider(swapQuote.swapTx.chainId)
      );

      await signAndWaitAllowanceFlow({ wallet, swapResponse: swapQuote });
    }
  }
}

swapWithAllowance()
  .then(() => console.log("Done"))
  .catch((e) => {
    console.error(e);
    if (e.response?.data) {
      console.log("Tx for debug sim:", e.response.data.transaction);
    }
  });
