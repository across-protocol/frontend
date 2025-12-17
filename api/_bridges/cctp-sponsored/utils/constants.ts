import { getDeployedAddress } from "@across-protocol/contracts";
import * as sdk from "@across-protocol/sdk";

import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../_constants";
import { CCTP_SUPPORTED_CHAINS } from "../../cctp/utils/constants";

// NOTE: For now, we always use fast CCTP mode
export const CCTP_TRANSFER_MODE = "fast" as const;

const SPONSORED_CCTP_SRC_PERIPHERY_ADDRESS_OVERRIDES: Record<number, string> = {
  // NOTE: Used for Lighter with owner set to dev wallet for testing
  [CHAIN_IDs.ARBITRUM]: "0xAA4958EFa0Cf6DdD87e354a90785f1D7291a82c7",
  [CHAIN_IDs.ARBITRUM_SEPOLIA]: "0x79176E2E91c77b57AC11c6fe2d2Ab2203D87AF85",
  [CHAIN_IDs.SOLANA_DEVNET]: "CPr4bRvkVKcSCLyrQpkZrRrwGzQeVAXutFU8WupuBLXq",
};

export const SPONSORED_CCTP_DST_PERIPHERY_ADDRESS_OVERRIDES: Record<
  number,
  string
> = {
  // NOTE: Used for Lighter
  [CHAIN_IDs.MAINNET]: "0x5616194d65638086a3191B1fEF436f503ff329eC",
  [CHAIN_IDs.HYPEREVM_TESTNET]: "0x06C61D54958a0772Ee8aF41789466d39FfeaeB13",
};

export function getSponsoredCctpSrcPeripheryAddress(
  chainId: number,
  throwIfNotFound: boolean = false
) {
  if (SPONSORED_CCTP_SRC_PERIPHERY_ADDRESS_OVERRIDES[chainId]) {
    return SPONSORED_CCTP_SRC_PERIPHERY_ADDRESS_OVERRIDES[chainId];
  }

  const address = getDeployedAddress(
    sdk.utils.chainIsSvm(chainId)
      ? "SponsoredCctpSrcPeriphery"
      : "SponsoredCCTPSrcPeriphery",
    chainId,
    throwIfNotFound
  );

  return address;
}

export function getSponsoredCctpDstPeripheryAddress(
  chainId: number,
  throwIfNotFound: boolean = false
) {
  if (SPONSORED_CCTP_DST_PERIPHERY_ADDRESS_OVERRIDES[chainId]) {
    return SPONSORED_CCTP_DST_PERIPHERY_ADDRESS_OVERRIDES[chainId];
  }

  const address = getDeployedAddress(
    "SponsoredCCTPDstPeriphery",
    chainId,
    throwIfNotFound
  );
  return address;
}

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

export const SPONSORED_CCTP_OUTPUT_TOKENS = [
  "USDC-SPOT",
  "USDH-SPOT",
  "USDT-SPOT",
  "USDC",
];

export const SPONSORED_CCTP_FINAL_TOKEN_PER_OUTPUT_TOKEN: Record<
  string,
  (typeof TOKEN_SYMBOLS_MAP)[keyof typeof TOKEN_SYMBOLS_MAP]
> = {
  "USDC-SPOT": TOKEN_SYMBOLS_MAP.USDC,
  "USDH-SPOT": TOKEN_SYMBOLS_MAP.USDH,
  "USDT-SPOT": TOKEN_SYMBOLS_MAP.USDT,
  USDC: TOKEN_SYMBOLS_MAP.USDC,
};

export const SPONSORED_CCTP_DESTINATION_CHAINS = [
  CHAIN_IDs.HYPERCORE,
  CHAIN_IDs.HYPERCORE_TESTNET,
  CHAIN_IDs.LIGHTER,
];
