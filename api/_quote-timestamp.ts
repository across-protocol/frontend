import * as sdk from "@across-protocol/sdk";

import { CHAIN_IDs } from "./_constants";

const DEPOSIT_WITH_DESTINATION_SWAP_EXPLICIT_EXPIRY_SECONDS = {
  default: 30,
  // Mainnet has longer block times, so we need to use a longer explicit expiry
  [CHAIN_IDs.MAINNET]: 60,
};

const DEPOSIT_QUOTE_TIME_BUFFER_SECONDS = 60 * 60; // 1 hour

export function getQuoteExpiryTimestamp(
  quoteTimestampFromApi: number | string,
  destinationSwapChainId?: number
) {
  const quoteTimestampNumber = Number(quoteTimestampFromApi);

  // If the deposit involves a destination swap, use the explicit expiry seconds
  if (destinationSwapChainId) {
    const expirySeconds =
      DEPOSIT_WITH_DESTINATION_SWAP_EXPLICIT_EXPIRY_SECONDS[
        destinationSwapChainId
      ] || DEPOSIT_WITH_DESTINATION_SWAP_EXPLICIT_EXPIRY_SECONDS.default;
    return sdk.utils.getCurrentTime() + expirySeconds;
  }

  // If no explicit expiry seconds are provided, use the implicit expiry
  // which is quote timestamp + deposit quote time buffer
  return quoteTimestampNumber + DEPOSIT_QUOTE_TIME_BUFFER_SECONDS;
}

export function getQuoteTimestampArg(
  quoteTimestampFromApi: number,
  destinationSwapChainId?: number
) {
  const quoteExpiryTimestamp = getQuoteExpiryTimestamp(
    quoteTimestampFromApi,
    destinationSwapChainId
  );

  return quoteExpiryTimestamp - DEPOSIT_QUOTE_TIME_BUFFER_SECONDS;
}
