import { Wallet } from "ethers";
import { utils } from "@across-protocol/sdk";
import { createKeyPairSignerFromBytes } from "@solana/kit";

import { getProvider } from "../../api/_utils";
import {
  fetchSwapQuotes,
  signAndWaitAllowanceFlow,
  signAndWaitPermitFlow,
  argsFromCli,
  getSvmSignerSeed,
  signAndWaitAllowanceFlowSvm,
} from "./_swap-utils";

async function swap() {
  const swapQuotes = await fetchSwapQuotes();

  for (const swapQuote of swapQuotes) {
    if (!swapQuote || !swapQuote.swapTx) {
      console.log("No swap quote");
      continue;
    }

    console.log("\nSwap quote:", JSON.stringify(swapQuote, null, 2));

    if (argsFromCli.skipTxExecution) {
      console.log("Skipping tx execution");
      continue;
    }

    if (
      utils.chainIsSvm(swapQuote.swapTx.chainId) &&
      process.env.DEV_WALLET_KEY_PAIR_SVM
    ) {
      const seed = getSvmSignerSeed();
      const wallet = await createKeyPairSignerFromBytes(seed);
      console.log("Executing tx on SVM using wallet:", wallet.address);

      if (swapQuote.eip712) {
        throw new Error("EIP712 not supported on SVM");
      } else {
        await signAndWaitAllowanceFlowSvm({ wallet, swapResponse: swapQuote });
      }
    } else if (process.env.DEV_WALLET_PK) {
      const wallet = new Wallet(process.env.DEV_WALLET_PK!).connect(
        getProvider(swapQuote.swapTx.chainId)
      );
      console.log("Executing tx on EVM using wallet:", wallet.address);

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
    } else {
      console.log(
        "Tx execution skipped due to missing env vars: 'DEV_WALLET_PK' or 'DEV_WALLET_KEY_PAIR_SVM'"
      );
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
