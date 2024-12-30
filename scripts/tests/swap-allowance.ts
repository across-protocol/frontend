import { Wallet } from "ethers";

import { getProvider } from "../../api/_utils";
import { fetchSwapQuote } from "./_swap-utils";

async function swapWithAllowance() {
  console.log("Swapping with allowance...");
  const swapQuote = await fetchSwapQuote("approval");

  if (process.env.DEV_WALLET_PK) {
    const wallet = new Wallet(process.env.DEV_WALLET_PK!).connect(
      getProvider(swapQuote.params.originChainId)
    );

    if (swapQuote.approvalTxns) {
      console.log("Approval needed...");
      let step = 1;
      for (const approvalTxn of swapQuote.approvalTxns) {
        const stepLabel = `(${step}/${swapQuote.approvalTxns.length})`;
        const tx = await wallet.sendTransaction({
          to: approvalTxn.to,
          data: approvalTxn.data,
        });
        console.log(`${stepLabel} Approval tx hash:`, tx.hash);
        await tx.wait();
        console.log(`${stepLabel} Approval tx mined`);
        step++;
      }
    }

    try {
      const tx = await wallet.sendTransaction({
        to: swapQuote.swapTx.to,
        data: swapQuote.swapTx.data,
        value: swapQuote.swapTx.value,
        gasLimit: swapQuote.swapTx.gas,
        gasPrice: swapQuote.swapTx.gasPrice,
      });
      console.log("Tx hash: ", tx.hash);
      await tx.wait();
      console.log("Tx mined");
    } catch (e) {
      console.error("Tx reverted", e);
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
