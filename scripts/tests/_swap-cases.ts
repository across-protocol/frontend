import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
import { ethers } from "ethers";

export const evmDepositor = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
export const svmDepositor = "FmMK62wrtWVb5SVoTZftSCGw3nEDA79hDbZNTRnC1R6t";
export const originChainId = CHAIN_IDs.OPTIMISM;
export const destinationChainId = CHAIN_IDs.ARBITRUM;
export const anyDestinationOutputTokens = {
  [CHAIN_IDs.ARBITRUM]: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34", // USDe
  [CHAIN_IDs.SOLANA]: "2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv", // PENGU
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
      depositor: evmDepositor,
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
      depositor: evmDepositor,
    },
  },
  // B2A - destination swap
  {
    labels: ["B2A", "MIN_OUTPUT", "USDC - USDe"],
    params: {
      amount: ethers.utils.parseUnits("1", 18).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[originChainId],
      originChainId,
      outputToken: anyDestinationOutputTokens[destinationChainId],
      destinationChainId,
      depositor: evmDepositor,
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
      depositor: evmDepositor,
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
      depositor: evmDepositor,
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
      depositor: evmDepositor,
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
      depositor: evmDepositor,
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
      depositor: evmDepositor,
    },
  },
  // A2A - origin swap and destination swap
  {
    labels: ["A2A", "MIN_OUTPUT", "bridged USDC - USDe"],
    params: {
      amount: ethers.utils.parseUnits("1", 18).toString(),
      tradeType: "minOutput",
      inputToken:
        TOKEN_SYMBOLS_MAP["USDC.e"].addresses[originChainId] ||
        TOKEN_SYMBOLS_MAP.USDbC.addresses[originChainId],
      originChainId,
      outputToken: anyDestinationOutputTokens[destinationChainId], // USDe
      destinationChainId,
      depositor: evmDepositor,
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
      depositor: evmDepositor,
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
      depositor: evmDepositor,
    },
  },
  // B2A - destination swap
  {
    labels: ["B2A", "EXACT_INPUT", "USDC - USDe"],
    params: {
      amount: ethers.utils.parseUnits("1", 6).toString(),
      tradeType: "exactInput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[originChainId],
      originChainId,
      outputToken: anyDestinationOutputTokens[destinationChainId],
      destinationChainId,
      depositor: evmDepositor,
    },
  },
  // A2B - origin swap
  {
    labels: ["A2B", "EXACT_INPUT", "USDC - Native ETH"],
    params: {
      amount: ethers.utils.parseUnits("1", 6).toString(),
      tradeType: "exactInput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[originChainId],
      originChainId,
      outputToken: ethers.constants.AddressZero,
      destinationChainId,
      depositor: evmDepositor,
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
      depositor: evmDepositor,
    },
  },
  // A2A - origin swap and destination swap
  {
    labels: ["A2A", "EXACT_INPUT", "bridged USDC - USDe"],
    params: {
      amount: ethers.utils.parseUnits("1", 6).toString(),
      tradeType: "exactInput",
      inputToken:
        TOKEN_SYMBOLS_MAP["USDC.e"].addresses[originChainId] ||
        TOKEN_SYMBOLS_MAP.USDbC.addresses[originChainId],
      originChainId,
      outputToken: anyDestinationOutputTokens[destinationChainId], // APE Coin
      destinationChainId,
      depositor: evmDepositor,
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
      inputToken: TOKEN_SYMBOLS_MAP.GHO.addresses[CHAIN_IDs.MAINNET],
      originChainId: CHAIN_IDs.MAINNET,
      outputToken: TOKEN_SYMBOLS_MAP.WGHO.addresses[CHAIN_IDs.LENS],
      destinationChainId: CHAIN_IDs.LENS,
      depositor: evmDepositor,
    },
  },
  // L1 GHO -> Lens GHO => any-to-bridgeable, i.e. origin swap (GHO->WGHO) + bridge and unwrap
  {
    labels: ["LENS", "L1 GHO - Lens GHO"],
    params: {
      amount: ethers.utils
        .parseUnits("0.01", TOKEN_SYMBOLS_MAP.GHO.decimals)
        .toString(),
      tradeType: "exactInput",
      inputToken: TOKEN_SYMBOLS_MAP.GHO.addresses[CHAIN_IDs.MAINNET],
      originChainId: CHAIN_IDs.MAINNET,
      outputToken: ethers.constants.AddressZero, // Indicates native input token on Lens,
      destinationChainId: CHAIN_IDs.LENS,
      depositor: evmDepositor,
    },
  },
  // L1 USDC -> Lens GHO => any-to-bridgeable, i.e. origin swap (USDC->WGHO) + bridge and unwrap
  {
    labels: ["LENS", "L1 USDC - Lens GHO"],
    params: {
      amount: ethers.utils
        .parseUnits("0.01", TOKEN_SYMBOLS_MAP.USDC.decimals)
        .toString(),
      tradeType: "exactInput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.MAINNET],
      originChainId: CHAIN_IDs.MAINNET,
      outputToken: ethers.constants.AddressZero, // Indicates native input token on Lens,
      destinationChainId: CHAIN_IDs.LENS,
      depositor: evmDepositor,
      recipient: "0x52A79C01f10e6Ea89dED5c3f42F3a0EC362ed090",
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
      inputToken: TOKEN_SYMBOLS_MAP.WGHO.addresses[CHAIN_IDs.LENS],
      originChainId: CHAIN_IDs.LENS,
      outputToken: TOKEN_SYMBOLS_MAP.GHO.addresses[CHAIN_IDs.MAINNET],
      destinationChainId: CHAIN_IDs.MAINNET,
      depositor: evmDepositor,
    },
  },
  // Lens GHO -> L1 GHO => bridgeable-to-any, i.e. bridge + destination swap (WGHO->GHO)
  {
    labels: ["LENS", "Lens GHO - L1 GHO"],
    params: {
      amount: ethers.utils
        .parseUnits("1", TOKEN_SYMBOLS_MAP.WGHO.decimals)
        .toString(),
      tradeType: "exactInput",
      inputToken: ethers.constants.AddressZero, // Indicates native input token on Lens
      originChainId: CHAIN_IDs.LENS,
      outputToken: TOKEN_SYMBOLS_MAP.GHO.addresses[CHAIN_IDs.MAINNET],
      destinationChainId: CHAIN_IDs.MAINNET,
      depositor: evmDepositor,
    },
  },
  // Lens GHO -> L1 USDC => bridgeable-to-any, i.e. bridge + destination swap (WGHO->GHO->USDC)
  {
    labels: ["LENS", "Lens GHO - L1 USDC"],
    params: {
      amount: ethers.utils
        .parseUnits("2", TOKEN_SYMBOLS_MAP.WGHO.decimals)
        .toString(),
      tradeType: "exactInput",
      inputToken: ethers.constants.AddressZero, // Indicates native input token on Lens
      originChainId: CHAIN_IDs.LENS,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.MAINNET],
      destinationChainId: CHAIN_IDs.MAINNET,
      depositor: evmDepositor,
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
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
      originChainId: CHAIN_IDs.OPTIMISM,
      outputToken: ethers.constants.AddressZero, // Indicates native output token GHO on Lens
      destinationChainId: CHAIN_IDs.LENS,
      depositor: evmDepositor,
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
      inputToken: TOKEN_SYMBOLS_MAP.DAI.addresses[CHAIN_IDs.OPTIMISM],
      originChainId: CHAIN_IDs.OPTIMISM,
      outputToken: ethers.constants.AddressZero, // Indicates native output token GHO on Lens
      destinationChainId: CHAIN_IDs.LENS,
      depositor: evmDepositor,
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
      originChainId: CHAIN_IDs.LENS,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.MAINNET],
      destinationChainId: CHAIN_IDs.MAINNET,
      depositor: evmDepositor,
    },
  },
  // Lens GHO -> Optimism USDC => bridgeable-to-any, i.e. origin swap () + destination swap (WGHO->GHO->USDC)
  {
    labels: ["LENS", "Lens GHO - Optimism USDC"],
    params: {
      amount: ethers.utils
        .parseUnits("1", TOKEN_SYMBOLS_MAP.GHO.decimals)
        .toString(),
      tradeType: "exactInput",
      inputToken: ethers.constants.AddressZero, // Indicates native input token on Lens
      originChainId: CHAIN_IDs.LENS,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
      destinationChainId: CHAIN_IDs.OPTIMISM,
      depositor: evmDepositor,
    },
  },
];

export const SOLANA_CASES = [
  // // B2B - exact input
  {
    labels: ["SOLANA", "A2B", "EXACT_INPUT", "USDC - USDC"],
    params: {
      amount: ethers.utils.parseUnits("1", 6).toString(),
      tradeType: "exactInput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.SOLANA],
      originChainId: CHAIN_IDs.SOLANA,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[destinationChainId],
      destinationChainId,
      depositor: svmDepositor,
      recipient: evmDepositor,
      refundAddress: evmDepositor,
    },
  },
  // A2B - exact input
  {
    labels: ["SOLANA", "A2B", "EXACT_INPUT", "PENGU - USDC"],
    params: {
      amount: ethers.utils.parseUnits("10", 6).toString(),
      tradeType: "exactInput",
      inputToken: anyDestinationOutputTokens[CHAIN_IDs.SOLANA],
      originChainId: CHAIN_IDs.SOLANA,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[destinationChainId],
      destinationChainId,
      depositor: svmDepositor,
      recipient: evmDepositor,
      refundAddress: evmDepositor,
    },
  },
];

export const USDT_OFT_COMPOSER_CASE = [
  // Polygon -> Arbitrum USDT
  {
    labels: ["OFT", "B2B", "EXACT_INPUT", "USDT - USDT", "POLYGON - ARBITRUM"],
    params: {
      amount: ethers.utils.parseUnits("1", 6).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.ARBITRUM],
      originChainId: CHAIN_IDs.ARBITRUM,
      outputToken: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.HYPEREVM],
      destinationChainId: CHAIN_IDs.HYPERCORE,
      depositor: evmDepositor,
      // skipOriginTxEstimation: true,
    },
  },
];
