import { Wallet } from "ethers";

import { getProvider } from "../../api/_utils";
import {
  fetchSwapQuotes,
  signAndWaitAllowanceFlow,
  signAndWaitPermitFlow,
  argsFromCli,
} from "./_swap-utils";

async function swap() {
  const swapQuotes = await fetchSwapQuotes();

  for (const swapQuote of swapQuotes) {
    if (!swapQuote || !swapQuote.swapTx) {
      console.log("No swap quote");
      continue;
    }

    console.log("\nSwap quote:", JSON.stringify(swapQuote, null, 2));

    if (process.env.DEV_WALLET_PK && !argsFromCli.skipTxExecution) {
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

swap()
  .then(() => console.log("Done"))
  .catch((e) => {
    console.error(e);
    if (e.response?.data) {
      console.log("Tx for debug sim:", e.response.data.transaction);
    }
  });
