import { Wallet } from "ethers";

import { getProvider } from "../../api/_utils";
import { fetchSwapQuote, signAndWaitAllowanceFlow } from "./_swap-utils";

async function swapWithAllowance() {
  console.log("Swapping with allowance...");
  const swapQuote = await fetchSwapQuote("approval");

  if (!swapQuote || !swapQuote.swapTx || !("data" in swapQuote.swapTx)) {
    console.log("No swap quote with tx data for approval");
    return;
  }

  if (process.env.DEV_WALLET_PK) {
    const wallet = new Wallet(process.env.DEV_WALLET_PK!).connect(
      getProvider(swapQuote.swapTx.chainId)
    );

    await signAndWaitAllowanceFlow({ wallet, swapResponse: swapQuote });
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
