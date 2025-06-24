import { Wallet } from "ethers";

import { getProvider } from "../../api/_utils";
import { fetchSwapQuotes, signAndWaitPermitFlow } from "./_swap-utils";

async function swapWithAuth() {
  console.log("Swapping with auth...");
  const swapQuotes = await fetchSwapQuotes("auth");

  if (swapQuotes.length === 0) {
    console.log("No swap quotes found");
    return;
  }

  for (const swapQuote of swapQuotes) {
    if (!swapQuote.swapTx || !swapQuote.eip712) {
      console.log("No swap quote with EIP712 data for auth");
      return;
    }

    if (process.env.DEV_WALLET_PK) {
      const wallet = new Wallet(process.env.DEV_WALLET_PK!).connect(
        getProvider(swapQuote.swapTx.chainId)
      );

      await signAndWaitPermitFlow({ wallet, swapResponse: swapQuote });
    }
  }
}

swapWithAuth()
  .then(() => console.log("Done"))
  .catch((e) => {
    console.error(e);
    if (e.response?.data) {
      console.log("Tx for debug sim:", e.response.data.transaction);
    }
  });
