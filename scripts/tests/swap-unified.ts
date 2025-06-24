import { Wallet } from "ethers";

import { getProvider } from "../../api/_utils";
import {
  fetchSwapQuotes,
  signAndWaitAllowanceFlow,
  signAndWaitPermitFlow,
} from "./_swap-utils";

async function swapUnified() {
  console.log("Swapping with unified endpoint...");
  const swapQuotes = await fetchSwapQuotes();

  if (swapQuotes.length === 0) {
    console.log("No swap quotes found");
    return;
  }

  for (const swapQuote of swapQuotes) {
    if (!swapQuote || !swapQuote.swapTx) {
      console.log("No swap quote");
      return;
    }

    if (process.env.DEV_WALLET_PK) {
      const wallet = new Wallet(process.env.DEV_WALLET_PK!).connect(
        getProvider(swapQuote.swapTx.chainId)
      );

      // if a permit-based flow is available, the unified endpoint will prefer that over an
      // allowance-based flow and return the relevant EIP712 data.
      if (swapQuote.eip712) {
        // sign permit + relay + track
        await signAndWaitPermitFlow({ wallet, swapResponse: swapQuote });
      }
      // if no permit-based flow is available, we can use the allowance-based flow
      else {
        // sign and send approval txns + swap txn
        await signAndWaitAllowanceFlow({ wallet, swapResponse: swapQuote });
      }
    }
  }
}

swapUnified()
  .then(() => console.log("Done"))
  .catch((e) => {
    console.error(e);
    if (e.response?.data) {
      console.log("Tx for debug sim:", e.response.data.transaction);
    }
  });
