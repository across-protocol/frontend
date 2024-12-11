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

// // Example config.
// export const RelayerConfigUpdate: RelayerFillLimit[] = [
//   {
//     originChainId: 1,
//     inputToken: "",
//     destinationChainId: 42161,
//     outputToken: "",
//     minExclusivityPeriod: 20,
//     minProfitThreshold: 0.0003,
//     balanceMultiplier: 0.6,
//     maxOutputAmount: 2500,
//   },
//   {
//     originChainId: 10,
//     inputToken: "",
//     destinationChainId: 42161,
//     outputToken: "",
//     minExclusivityPeriod: 5,
//     minProfitThreshold: 0.0003,
//     balanceMultiplier: 0.6,
//     maxOutputAmount: 2500,
//   },
//   {
//     originChainId: 137,
//     inputToken: "",
//     destinationChainId: 42161,
//     outputToken: "",
//     minExclusivityPeriod: 5,
//     minProfitThreshold: 0.0003,
//     balanceMultiplier: 0.6,
//     maxOutputAmount: 2500,
//   },
//   {
//     originChainId: 324,
//     inputToken: "",
//     destinationChainId: 42161,
//     outputToken: "",
//     minExclusivityPeriod: 5,
//     minProfitThreshold: 0.0003,
//     balanceMultiplier: 0.6,
//     maxOutputAmount: 2500,
//   },
// ];
