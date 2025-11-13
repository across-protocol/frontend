import { ethers } from "ethers";

import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../_constants";
import { CCTP_SUPPORTED_CHAINS } from "../../cctp/utils/constants";
import { getEnvs } from "../../../_env";

// NOTE: For now, we always use fast CCTP mode
export const CCTP_TRANSFER_MODE = "fast" as const;

export const SPONSORED_CCTP_QUOTE_FINALIZER_ADDRESS =
  getEnvs().SPONSORED_CCTP_QUOTE_FINALIZER_ADDRESS ||
  ethers.constants.AddressZero;

export const SPONSORED_CCTP_SRC_PERIPHERY_ADDRESSES = {
  [CHAIN_IDs.ARBITRUM]: "0x5450fd941ec43b4fc419f12fe81d3b0a88af7461",
  [CHAIN_IDs.BASE]: "0x97f097369fbf9e0d9a4800ca924074f814db81e9",
  [CHAIN_IDs.ARBITRUM_SEPOLIA]: "0x79176E2E91c77b57AC11c6fe2d2Ab2203D87AF85",
};

export const SPONSORED_CCTP_DST_PERIPHERY_ADDRESSES = {
  [CHAIN_IDs.HYPEREVM]: "0x7b164050bbc8e7ef3253e7db0d74b713ba3f1c95",
  [CHAIN_IDs.HYPEREVM_TESTNET]: "0x06C61D54958a0772Ee8aF41789466d39FfeaeB13",
};

export const SPONSORED_CCTP_ORIGIN_CHAINS = CCTP_SUPPORTED_CHAINS.filter(
  (chainId) =>
    ![
      CHAIN_IDs.HYPERCORE,
      CHAIN_IDs.HYPERCORE_TESTNET,
      CHAIN_IDs.HYPEREVM,
      CHAIN_IDs.HYPEREVM_TESTNET,
    ].includes(chainId)
);

export const SPONSORED_CCTP_INPUT_TOKENS = ["USDC"];

export const SPONSORED_CCTP_OUTPUT_TOKENS = ["USDC", "USDH-SPOT"];

export const SPONSORED_CCTP_FINAL_TOKEN_PER_OUTPUT_TOKEN: Record<
  string,
  (typeof TOKEN_SYMBOLS_MAP)[keyof typeof TOKEN_SYMBOLS_MAP]
> = {
  USDC: TOKEN_SYMBOLS_MAP.USDC,
  "USDH-SPOT": TOKEN_SYMBOLS_MAP.USDH,
};

export const SPONSORED_CCTP_DESTINATION_CHAINS = [
  CHAIN_IDs.HYPERCORE,
  CHAIN_IDs.HYPERCORE_TESTNET,
];
