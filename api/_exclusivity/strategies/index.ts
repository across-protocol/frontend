import * as sdk from "@across-protocol/sdk";
const { ZERO_ADDRESS } = sdk.constants;

export * from "./weighted-random";

// Default strategy
export const none = (_: string[]) => ZERO_ADDRESS;
