import * as sdk from "@across-protocol/sdk";

const DEPOSIT_WITH_DESTINATION_SWAP_EXPLICIT_EXPIRY_SECONDS = 30;

const DEPOSIT_QUOTE_TIME_BUFFER_SECONDS = 60 * 60; // 1 hour

export function getQuoteExpiryTimestamp(
  quoteTimestampFromApi: number | string,
  involvesDestinationSwap?: boolean
) {
  const quoteTimestampNumber = Number(quoteTimestampFromApi);

  // If the deposit involves a destination swap, use the explicit expiry seconds
  if (involvesDestinationSwap) {
    return (
      sdk.utils.getCurrentTime() +
      DEPOSIT_WITH_DESTINATION_SWAP_EXPLICIT_EXPIRY_SECONDS
    );
  }

  // If no explicit expiry seconds are provided, use the implicit expiry
  // which is quote timestamp + deposit quote time buffer
  return quoteTimestampNumber + DEPOSIT_QUOTE_TIME_BUFFER_SECONDS;
}

export function getQuoteTimestampArg(
  quoteTimestampFromApi: number,
  involvesDestinationSwap?: boolean
) {
  const quoteExpiryTimestamp = getQuoteExpiryTimestamp(
    quoteTimestampFromApi,
    involvesDestinationSwap
  );

  return quoteExpiryTimestamp - DEPOSIT_QUOTE_TIME_BUFFER_SECONDS;
}
