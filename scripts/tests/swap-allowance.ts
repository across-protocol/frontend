import axios from "axios";
import { Wallet } from "ethers";
import dotenv from "dotenv";
import { getProvider } from "../../api/_utils";
import {
  filterTestCases,
  MIN_OUTPUT_CASES,
  EXACT_OUTPUT_CASES,
  SWAP_API_BASE_URL,
} from "./_swap-utils";
dotenv.config();

/**
 * Manual test script for the swap API. Should be converted to a proper test suite.
 */
async function swap() {
  const filterString = process.argv[2];
  const testCases = [...MIN_OUTPUT_CASES, ...EXACT_OUTPUT_CASES];
  const filteredTestCases = filterTestCases(testCases, filterString);
  for (const testCase of filteredTestCases) {
    console.log("\nTest case:", testCase.labels.join(" "));
    const response = await axios.get(
      `${SWAP_API_BASE_URL}/api/swap/allowance`,
      {
        params: testCase.params,
      }
    );
    console.log(response.data);

    if (process.env.DEV_WALLET_PK) {
      const wallet = new Wallet(process.env.DEV_WALLET_PK!).connect(
        getProvider(testCase.params.originChainId)
      );

      if (response.data.approvalTxns) {
        console.log("Approval needed...");
        let step = 1;
        for (const approvalTxn of response.data.approvalTxns) {
          const stepLabel = `(${step}/${response.data.approvalTxns.length})`;
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
          to: response.data.swapTx.to,
          data: response.data.swapTx.data,
          value: response.data.swapTx.value,
          gasLimit: response.data.swapTx.gas,
          gasPrice: response.data.swapTx.gasPrice,
        });
        console.log("Tx hash: ", tx.hash);
        await tx.wait();
        console.log("Tx mined");
      } catch (e) {
        console.error("Tx reverted", e);
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
