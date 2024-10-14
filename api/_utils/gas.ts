import { utils as sdkUtils } from "@across-protocol/sdk";

import { CHAIN_IDs } from "../_constants";

const { GAS_MARKUP } = process.env;

export const gasMarkup: {
  [chainId: string]: number;
} = GAS_MARKUP ? JSON.parse(GAS_MARKUP) : {};
// Default to no markup.
export const DEFAULT_GAS_MARKUP = 0;

export const getGasMarkup = (chainId: string | number) => {
  if (typeof gasMarkup[chainId] === "number") {
    return gasMarkup[chainId];
  }

  return sdkUtils.chainIsOPStack(Number(chainId))
    ? gasMarkup[CHAIN_IDs.OPTIMISM] ?? DEFAULT_GAS_MARKUP
    : DEFAULT_GAS_MARKUP;
};
