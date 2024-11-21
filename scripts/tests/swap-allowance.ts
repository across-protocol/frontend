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
const MIN_OUTPUT_CASES = [
  // B2B
  {
    labels: ["B2B", "MIN_OUTPUT", "Base USDC - Arbitrum USDC"],
    params: {
      minOutputAmount: ethers.utils.parseUnits("1", 6).toString(),
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
      originChainId: CHAIN_IDs.BASE,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
      destinationChainId: CHAIN_IDs.ARBITRUM,
      depositor,
    },
  },
  {
    labels: ["B2B", "MIN_OUTPUT", "Base USDC - Arbitrum ETH"],
    params: {
      minOutputAmount: ethers.utils.parseUnits("0.001", 18).toString(),
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
      originChainId: CHAIN_IDs.BASE,
      outputToken: ethers.constants.AddressZero,
      destinationChainId: CHAIN_IDs.ARBITRUM,
      depositor,
    },
  },
  {
    labels: ["B2B", "MIN_OUTPUT", "Arbitrum ETH - Base USDC"],
    params: {
      minOutputAmount: ethers.utils.parseUnits("3", 6).toString(),
      inputToken: ethers.constants.AddressZero,
      originChainId: CHAIN_IDs.ARBITRUM,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
      destinationChainId: CHAIN_IDs.BASE,
      depositor,
    },
  },
  // B2A
  {
    labels: ["B2A", "MIN_OUTPUT", "Base USDC - Arbitrum WETH"],
    params: {
      minOutputAmount: ethers.utils.parseUnits("0.001", 18).toString(),
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
      originChainId: CHAIN_IDs.BASE,
      outputToken: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.ARBITRUM],
      destinationChainId: CHAIN_IDs.ARBITRUM,
      depositor,
    },
  },
  {
    labels: ["B2A", "MIN_OUTPUT", "Base USDC - Arbitrum ETH"],
    params: {
      minOutputAmount: ethers.utils.parseUnits("0.001", 18).toString(),
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
      originChainId: CHAIN_IDs.BASE,
      outputToken: ethers.constants.AddressZero,
      destinationChainId: CHAIN_IDs.ARBITRUM,
      depositor,
    },
  },
  // A2B
  {
    labels: ["A2B", "MIN_OUTPUT", "Base USDbC - Arbitrum USDC"],
    params: {
      minOutputAmount: ethers.utils.parseUnits("1", 6).toString(),
      inputToken: TOKEN_SYMBOLS_MAP.USDbC.addresses[CHAIN_IDs.BASE],
      originChainId: CHAIN_IDs.BASE,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
      destinationChainId: CHAIN_IDs.ARBITRUM,
      depositor,
    },
  },
  // A2A
  {
    labels: ["A2A", "MIN_OUTPUT", "Base USDbC - Arbitrum APE"],
    params: {
      minOutputAmount: ethers.utils.parseUnits("1", 18).toString(),
      inputToken: TOKEN_SYMBOLS_MAP.USDbC.addresses[CHAIN_IDs.BASE],
      originChainId: CHAIN_IDs.BASE,
      outputToken: "0x74885b4D524d497261259B38900f54e6dbAd2210", // APE Coin
      destinationChainId: CHAIN_IDs.ARBITRUM,
      depositor,
    },
  },
];
const EXACT_OUTPUT_CASES = [
  // B2B
  {
    labels: ["B2B", "EXACT_OUTPUT", "Base USDC - Arbitrum USDC"],
    params: {
      exactOutputAmount: ethers.utils.parseUnits("1", 6).toString(),
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
      originChainId: CHAIN_IDs.BASE,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
      destinationChainId: CHAIN_IDs.ARBITRUM,
      depositor,
    },
  },
  {
    labels: ["B2B", "EXACT_OUTPUT", "Base USDC -Arbitrum ETH"],
    params: {
      exactOutputAmount: ethers.utils.parseUnits("0.001", 18).toString(),
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
      originChainId: CHAIN_IDs.BASE,
      outputToken: ethers.constants.AddressZero,
      destinationChainId: CHAIN_IDs.ARBITRUM,
      depositor,
    },
  },
  // B2A
  {
    labels: ["B2A", "EXACT_OUTPUT", "Base USDC - Arbitrum WETH"],
    params: {
      exactOutputAmount: ethers.utils.parseUnits("0.001", 18).toString(),
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
      originChainId: CHAIN_IDs.BASE,
      outputToken: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.ARBITRUM],
      destinationChainId: CHAIN_IDs.ARBITRUM,
      depositor,
    },
  },
  {
    labels: ["B2A", "EXACT_OUTPUT", "Base USDC - Arbitrum ETH"],
    params: {
      exactOutputAmount: ethers.utils.parseUnits("0.001", 18).toString(),
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
      originChainId: CHAIN_IDs.BASE,
      outputToken: ethers.constants.AddressZero,
      destinationChainId: CHAIN_IDs.ARBITRUM,
      depositor,
    },
  },
  // A2B
  {
    labels: ["A2B", "EXACT_OUTPUT", "Base USDbC - Arbitrum USDC"],
    params: {
      minOutputAmount: ethers.utils.parseUnits("1", 6).toString(),
      inputToken: TOKEN_SYMBOLS_MAP.USDbC.addresses[CHAIN_IDs.BASE],
      originChainId: CHAIN_IDs.BASE,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
      destinationChainId: CHAIN_IDs.ARBITRUM,
      depositor,
    },
  },
  // A2A
  {
    labels: ["A2A", "EXACT_OUTPUT", "Base USDbC - Arbitrum APE"],
    params: {
      minOutputAmount: ethers.utils.parseUnits("1", 18).toString(),
      inputToken: TOKEN_SYMBOLS_MAP.USDbC.addresses[CHAIN_IDs.BASE],
      originChainId: CHAIN_IDs.BASE,
      outputToken: "0x74885b4D524d497261259B38900f54e6dbAd2210", // APE Coin
      destinationChainId: CHAIN_IDs.ARBITRUM,
      depositor,
    },
  },
];

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
      try {
        const tx = await wallet.sendTransaction({
          to: response.data.tx.to,
          data: response.data.tx.data,
          value: response.data.tx.value,
          gasLimit: response.data.tx.gas,
          gasPrice: response.data.tx.gasPrice,
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
  .catch(console.error);
