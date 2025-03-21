import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
import { ethers } from "ethers";

export const depositor = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
export const originChainId = CHAIN_IDs.OPTIMISM;
export const destinationChainId = CHAIN_IDs.ARBITRUM;
export const anyDestinationOutputTokens = {
  [CHAIN_IDs.ARBITRUM]: "0x74885b4D524d497261259B38900f54e6dbAd2210", // APE
};

export const MIN_OUTPUT_CASES = [
  // B2B - only bridge
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
  // B2A - destination swap
  {
    labels: ["B2A", "MIN_OUTPUT", "USDC - APE"],
    params: {
      amount: ethers.utils.parseUnits("3", 18).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[originChainId],
      originChainId,
      outputToken: anyDestinationOutputTokens[destinationChainId],
      destinationChainId,
      depositor,
    },
  },
  // A2B - origin swap
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
  {
    labels: ["A2B", "MIN_OUTPUT", "USDC - WETH"],
    params: {
      amount: ethers.utils.parseUnits("0.001", 18).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[originChainId],
      originChainId,
      outputToken: TOKEN_SYMBOLS_MAP.WETH.addresses[destinationChainId],
      destinationChainId,
      depositor,
    },
  },
  {
    labels: ["A2B", "MIN_OUTPUT", "WETH - USDC"],
    params: {
      amount: ethers.utils.parseUnits("1", 6).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.WETH.addresses[originChainId],
      originChainId,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[destinationChainId],
      destinationChainId,
      depositor,
    },
  },
  {
    labels: ["A2B", "MIN_OUTPUT", "USDC - Native ETH"],
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
    labels: ["A2B", "MIN_OUTPUT", "Native ETH - USDC"],
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
  // A2A - origin swap and destination swap
  {
    labels: ["A2A", "MIN_OUTPUT", "bridged USDC - APE"],
    params: {
      amount: ethers.utils.parseUnits("1", 18).toString(),
      tradeType: "minOutput",
      inputToken:
        TOKEN_SYMBOLS_MAP["USDC.e"].addresses[originChainId] ||
        TOKEN_SYMBOLS_MAP.USDbC.addresses[originChainId],
      originChainId,
      outputToken: anyDestinationOutputTokens[destinationChainId], // APE Coin
      destinationChainId,
      depositor,
    },
  },
];

export const EXACT_OUTPUT_CASES = MIN_OUTPUT_CASES.map((testCase) => ({
  labels: testCase.labels.map((label) => label.replace("MIN", "EXACT")),
  params: {
    ...testCase.params,
    tradeType: "exactOutput",
  },
}));

export const EXACT_INPUT_CASES = [
  // B2B - only bridge
  {
    labels: ["B2B", "EXACT_INPUT", "USDC - USDC"],
    params: {
      amount: ethers.utils.parseUnits("1", 6).toString(),
      tradeType: "exactInput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[originChainId],
      originChainId,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[destinationChainId],
      destinationChainId,
      depositor,
    },
  },
  {
    labels: ["B2B", "EXACT_INPUT", "Native ETH - Native ETH"],
    params: {
      amount: ethers.utils.parseUnits("0.001", 18).toString(),
      tradeType: "exactInput",
      inputToken: ethers.constants.AddressZero,
      originChainId,
      outputToken: ethers.constants.AddressZero,
      destinationChainId,
      depositor,
    },
  },
  // B2A - destination swap
  {
    labels: ["B2A", "EXACT_INPUT", "USDC - APE"],
    params: {
      amount: ethers.utils.parseUnits("3", 6).toString(),
      tradeType: "exactInput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[originChainId],
      originChainId,
      outputToken: anyDestinationOutputTokens[destinationChainId],
      destinationChainId,
      depositor,
    },
  },
  // A2B - origin swap
  {
    labels: ["A2B", "EXACT_INPUT", "USDC - Native ETH"],
    params: {
      amount: ethers.utils.parseUnits("3", 6).toString(),
      tradeType: "exactInput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[originChainId],
      originChainId,
      outputToken: ethers.constants.AddressZero,
      destinationChainId,
      depositor,
    },
  },
  {
    labels: ["A2B", "EXACT_INPUT", "Native ETH - USDC"],
    params: {
      amount: ethers.utils.parseUnits("0.001", 18).toString(),
      tradeType: "exactInput",
      inputToken: ethers.constants.AddressZero,
      originChainId,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[destinationChainId],
      destinationChainId,
      depositor,
    },
  },
  // A2A - origin swap and destination swap
  {
    labels: ["A2A", "EXACT_INPUT", "bridged USDC - APE"],
    params: {
      amount: ethers.utils.parseUnits("1", 6).toString(),
      tradeType: "exactInput",
      inputToken:
        TOKEN_SYMBOLS_MAP["USDC.e"].addresses[originChainId] ||
        TOKEN_SYMBOLS_MAP.USDbC.addresses[originChainId],
      originChainId,
      outputToken: anyDestinationOutputTokens[destinationChainId], // APE Coin
      destinationChainId,
      depositor,
    },
  },
];

export const LENS_CASES = [
  // L1 GHO -> Lens WGHO => any-to-bridgeable, i.e. origin swap (GHO->WGHO) + bridge
  {
    labels: ["LENS", "L1 GHO - Lens WGHO"],
    params: {
      amount: ethers.utils
        .parseUnits("1", TOKEN_SYMBOLS_MAP.GHO.decimals)
        .toString(),
      tradeType: "exactInput",
      inputToken: TOKEN_SYMBOLS_MAP.GHO.addresses[1],
      originChainId: 1,
      outputToken: TOKEN_SYMBOLS_MAP.WGHO.addresses[232],
      destinationChainId: 232,
      depositor,
    },
  },
  // Lens WGHO -> L1 GHO => bridgeable-to-any, i.e. bridge + destination swap (WGHO->GHO)
  {
    labels: ["LENS", "Lens WGHO - L1 GHO"],
    params: {
      amount: ethers.utils
        .parseUnits("1", TOKEN_SYMBOLS_MAP.WGHO.decimals)
        .toString(),
      tradeType: "exactInput",
      inputToken: TOKEN_SYMBOLS_MAP.WGHO.addresses[232],
      originChainId: 232,
      outputToken: TOKEN_SYMBOLS_MAP.GHO.addresses[1],
      destinationChainId: 1,
      depositor,
    },
  },
  // Optimism USDC -> Lens GHO => bridgeable-to-any, i.e. bridge + destination swap (USDC->WGHO) + unwrap
  {
    labels: ["LENS", "Optimism USDC - Lens GHO"],
    params: {
      amount: ethers.utils
        .parseUnits("1", TOKEN_SYMBOLS_MAP.USDC.decimals)
        .toString(),
      tradeType: "exactInput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[10],
      originChainId: 10,
      outputToken: ethers.constants.AddressZero, // Indicates native output token GHO on Lens
      destinationChainId: 232,
      depositor,
    },
  },
  // Optimism DAI -> Lens GHO => any-to-any, i.e. origin swap (DAI->USDC) + destination swap (USDC->WGHO) + unwrap
  {
    labels: ["LENS", "Optimism DAI - Lens GHO"],
    params: {
      amount: ethers.utils
        .parseUnits("1", TOKEN_SYMBOLS_MAP.DAI.decimals)
        .toString(),
      tradeType: "exactInput",
      inputToken: TOKEN_SYMBOLS_MAP.DAI.addresses[10],
      originChainId: 10,
      outputToken: ethers.constants.AddressZero, // Indicates native output token GHO on Lens
      destinationChainId: 232,
      depositor,
    },
  },
  // Lens GHO -> L1 USDC => bridgeable-to-any, i.e. bridge + destination swap (WGHO->GHO->USDC)
  {
    labels: ["LENS", "Lens GHO - L1 USDC"],
    params: {
      amount: ethers.utils
        .parseUnits("1", TOKEN_SYMBOLS_MAP.GHO.decimals)
        .toString(),
      tradeType: "exactInput",
      inputToken: ethers.constants.AddressZero, // Indicates native input token on Lens
      originChainId: 232,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[1],
      destinationChainId: 1,
      depositor,
    },
  },
];
