import axios from "axios";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
import { ethers } from "ethers";

import { resolveVercelEndpoint } from "../../api/_utils";

/**
 * Manual test script for the swap API. Should be converted to a proper test suite.
 */

const depositor = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
const MIN_OUTPUT_CASES = [
  // B2B
  {
    minOutputAmount: ethers.utils.parseUnits("100", 6).toString(),
    inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
    originChainId: CHAIN_IDs.BASE,
    outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
    destinationChainId: CHAIN_IDs.ARBITRUM,
    recipient: depositor,
    integratorId: "test",
  },
  // B2A
  {
    minOutputAmount: ethers.utils.parseUnits("1", 18).toString(),
    inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
    originChainId: CHAIN_IDs.BASE,
    outputToken: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.ARBITRUM],
    destinationChainId: CHAIN_IDs.ARBITRUM,
    recipient: depositor,
    integratorId: "test",
  },
  // A2B
  {
    minOutputAmount: ethers.utils.parseUnits("100", 6).toString(),
    inputToken: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", // DEGEN
    originChainId: CHAIN_IDs.BASE,
    outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
    destinationChainId: CHAIN_IDs.ARBITRUM,
    recipient: depositor,
    integratorId: "test",
  },
  // A2A
  {
    minOutputAmount: ethers.utils.parseUnits("100", 18).toString(),
    inputToken: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", // DEGEN
    originChainId: CHAIN_IDs.BASE,
    outputToken: "0x74885b4D524d497261259B38900f54e6dbAd2210", // APE Coin
    destinationChainId: CHAIN_IDs.ARBITRUM,
    recipient: depositor,
    integratorId: "test",
  },
];

async function swap() {
  for (const testCase of MIN_OUTPUT_CASES) {
    const response = await axios.get(`${resolveVercelEndpoint()}/api/swap`, {
      params: testCase,
    });
    console.log(response.data);
  }
}

swap()
  .then(() => console.log("Done"))
  .catch(console.error);
