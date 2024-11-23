import axios from "axios";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
import { ethers, Wallet } from "ethers";
import dotenv from "dotenv";
import { getProvider } from "../../api/_utils";
dotenv.config();

/**
 * Manual test script for the swap API. Should be converted to a proper test suite.
 */

const depositor = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
const originChainId = CHAIN_IDs.OPTIMISM;
const destinationChainId = CHAIN_IDs.ARBITRUM;
const anyDestinationOutputTokens = {
  [CHAIN_IDs.ARBITRUM]: "0x74885b4D524d497261259B38900f54e6dbAd2210", // APE
};

const MIN_OUTPUT_CASES = [
  // B2B
  {
    labels: ["B2B", "MIN_OUTPUT", "USDC - USDC"],
    params: {
      amount: ethers.utils.parseUnits("1", 6).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[originChainId],
      originChainId,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[destinationChainId],
      destinationChainId,
      depositor,
    },
  },
  {
    labels: ["B2B", "MIN_OUTPUT", "Native ETH - Native ETH"],
    params: {
      amount: ethers.utils.parseUnits("0.001", 18).toString(),
      tradeType: "minOutput",
      inputToken: ethers.constants.AddressZero,
      originChainId,
      outputToken: ethers.constants.AddressZero,
      destinationChainId,
      depositor,
    },
  },
  {
    labels: ["B2B", "MIN_OUTPUT", "USDC - Native ETH"],
    params: {
      amount: ethers.utils.parseUnits("0.001", 18).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[originChainId],
      originChainId,
      outputToken: ethers.constants.AddressZero,
      destinationChainId,
      depositor,
    },
  },
  {
    labels: ["B2B", "MIN_OUTPUT", "Native ETH - USDC"],
    params: {
      amount: ethers.utils.parseUnits("3", 6).toString(),
      tradeType: "minOutput",
      inputToken: ethers.constants.AddressZero,
      originChainId,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[destinationChainId],
      destinationChainId,
      depositor,
    },
  },
  // B2A
  {
    labels: ["B2A", "MIN_OUTPUT", "USDC - APE"],
    params: {
      amount: ethers.utils.parseUnits("1", 18).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[originChainId],
      originChainId,
      outputToken: anyDestinationOutputTokens[destinationChainId],
      destinationChainId,
      depositor,
    },
  },
  {
    labels: ["B2A", "MIN_OUTPUT", "USDC - Native ETH"],
    params: {
      amount: ethers.utils.parseUnits("0.001", 18).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[originChainId],
      originChainId,
      outputToken: ethers.constants.AddressZero,
      destinationChainId,
      depositor,
    },
  },
  // A2B
  {
    labels: ["A2B", "MIN_OUTPUT", "bridged USDC - USDC"],
    params: {
      amount: ethers.utils.parseUnits("1", 6).toString(),
      tradeType: "minOutput",
      inputToken:
        TOKEN_SYMBOLS_MAP["USDC.e"].addresses[originChainId] ||
        TOKEN_SYMBOLS_MAP.USDbC.addresses[originChainId],
      originChainId,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[destinationChainId],
      destinationChainId,
      depositor,
    },
  },
  // A2A
  {
    labels: ["A2A", "MIN_OUTPUT", "bridged USDC - APE"],
    params: {
      amount: ethers.utils.parseUnits("1", 18).toString(),
      tradeType: "minOutput",
      inputToken:
        TOKEN_SYMBOLS_MAP["USDC.e"].addresses[originChainId] ||
        TOKEN_SYMBOLS_MAP.USDbC.addresses[originChainId],
      originChainId: CHAIN_IDs.BASE,
      outputToken: anyDestinationOutputTokens[destinationChainId], // APE Coin
      destinationChainId,
      depositor,
    },
  },
];
const EXACT_OUTPUT_CASES = MIN_OUTPUT_CASES.map((testCase) => ({
  labels: testCase.labels.map((label) => label.replace("MIN", "EXACT")),
  params: {
    ...testCase.params,
    tradeType: "exactOutput",
  },
}));

async function swap() {
  const filterString = process.argv[2];
  const testCases = [...MIN_OUTPUT_CASES, ...EXACT_OUTPUT_CASES];
  const labelsToFilter = filterString ? filterString.split(",") : [];
  const filteredTestCases = testCases.filter((testCase) => {
    const matches = labelsToFilter.filter((label) =>
      testCase.labels
        .map((label) => label.toLowerCase())
        .includes(label.toLowerCase())
    );
    return matches.length === labelsToFilter.length;
  });
  for (const testCase of filteredTestCases) {
    console.log("\nTest case:", testCase.labels.join(" "));
    const response = await axios.get(
      `http://localhost:3000/api/swap/allowance`,
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
