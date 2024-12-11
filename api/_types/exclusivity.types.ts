import { boolean, Infer, object, optional } from "superstruct";
import { positiveIntStr, validAddress } from "../_utils";

export const RelayerFillLimitSchema = object({
  originChainId: positiveIntStr(),
  destinationChainId: positiveIntStr(),
  inputToken: validAddress(),
  outputToken: validAddress(),
  minOutputAmount: optional(positiveIntStr()),
  maxOutputAmount: optional(positiveIntStr()),
  minExclusivityPeriod: optional(positiveIntStr()),
  minProfitThreshold: optional(positiveIntStr()),
  balanceMultiplier: optional(positiveIntStr()),
  msgFill: boolean(),
});

export type RelayerFillLimit = Infer<typeof RelayerFillLimitSchema>;
