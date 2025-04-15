import * as sdk from "@across-protocol/sdk";

export * from "./weighted-random";

// Default strategy
export const none = (_: string[]) => sdk.ZERO_BYTES;
