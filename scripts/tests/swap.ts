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
    label: "B2B",
    minOutputAmount: ethers.utils.parseUnits("1", 6).toString(),
    inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
    originChainId: CHAIN_IDs.BASE,
    outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
    destinationChainId: CHAIN_IDs.ARBITRUM,
    depositor,
  },
  // B2A
  {
    label: "B2A",
    minOutputAmount: ethers.utils.parseUnits("1", 18).toString(),
    inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
    originChainId: CHAIN_IDs.BASE,
    outputToken: "0x74885b4D524d497261259B38900f54e6dbAd2210", // APE Coin
    destinationChainId: CHAIN_IDs.ARBITRUM,
    depositor,
  },
  // A2B
  {
    label: "A2B",
    minOutputAmount: ethers.utils.parseUnits("1", 6).toString(),
    inputToken: TOKEN_SYMBOLS_MAP.USDbC.addresses[CHAIN_IDs.BASE],
    originChainId: CHAIN_IDs.BASE,
    outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
    destinationChainId: CHAIN_IDs.ARBITRUM,
    depositor,
  },
  // A2A
  {
    label: "A2A",
    minOutputAmount: ethers.utils.parseUnits("1", 18).toString(),
    inputToken: TOKEN_SYMBOLS_MAP.USDbC.addresses[CHAIN_IDs.BASE],
    originChainId: CHAIN_IDs.BASE,
    outputToken: "0x74885b4D524d497261259B38900f54e6dbAd2210", // APE Coin
    destinationChainId: CHAIN_IDs.ARBITRUM,
    depositor,
    slippageTolerance: 1,
  },
];

async function swap() {
  for (const testCase of MIN_OUTPUT_CASES) {
    console.log("\nTest case:", testCase.label);
    const response = await axios.get(`http://localhost:3000/api/swap`, {
      params: testCase,
    });
    console.log(response.data);

    if (process.env.DEV_WALLET_PK) {
      const wallet = new Wallet(process.env.DEV_WALLET_PK!).connect(
        getProvider(testCase.originChainId)
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
