import { array, boolean, Infer, object, optional } from "superstruct";
import { positiveFloatStr, positiveIntStr, validAddress } from "../_utils";
import { TypedVercelRequest } from "./generic.types";

export const RelayerRoute = object({
  originChainId: positiveIntStr(),
  inputToken: validAddress(),
  destinationChainId: positiveIntStr(),
  outputToken: validAddress(),
});

export const RelayerFillLimitSchema = object({
  minOutputAmount: positiveIntStr(),
  maxOutputAmount: positiveIntStr(),
  minProfitThreshold: positiveFloatStr(),
  minExclusivityPeriod: optional(positiveIntStr()),
  balanceMultiplier: optional(positiveFloatStr()),
  msgFill: optional(boolean()),
});

export const RelayerFillLimitArraySchema = array(RelayerFillLimitSchema);
export const RelayerRouteUpdateSchema = object({
  RelayerRoute,
  RelayerFillLimitArraySchema,
});

export type RelayerFillLimit = Infer<typeof RelayerFillLimitSchema>;

export type RelayerConfigUpdate = {
  timestamp: number;
  originChainId: string;
  inputToken: string;
  destinationChainId: string;
  outputToken: string;
  relayerFillLimits: RelayerFillLimit[];
};

export type TypedRelayerConfigUpdateRequest = TypedVercelRequest<
  never,
  RelayerConfigUpdate
>;

// // Example config.
// export const RelayerConfigUpdate: RelayerFillLimit[] = [
//   {
//     originChainId: "1",
//     inputToken: "",
//     destinationChainId: "42161",
//     outputToken: "",
//     minExclusivityPeriod: "20",
//     minProfitThreshold: "0.0003",
//     balanceMultiplier: "0.6",
//     minOutputAmount: "1",
//     maxOutputAmount: "250",
//   },
//   {
//     originChainId: "10",
//     inputToken: "",
//     destinationChainId: "42161",
//     outputToken: "",
//     minExclusivityPeriod: "5",
//     minProfitThreshold: "0.0003",
//     balanceMultiplier: "0.6",
//     minOutputAmount: "251",
//     maxOutputAmount: "500",
//   },
//   {
//     originChainId: "137",
//     inputToken: "",
//     destinationChainId: "42161",
//     outputToken: "",
//     minExclusivityPeriod: "5",
//     minProfitThreshold: "0.0003",
//     balanceMultiplier: "0.6",
//     minOutputAmount: "501",
//     maxOutputAmount: "1000",
//   },
//   {
//     originChainId: "324",
//     inputToken: "",
//     destinationChainId: "42161",
//     outputToken: "",
//     minExclusivityPeriod: "5",
//     minProfitThreshold: "0.0003",
//     balanceMultiplier: "0.6",
//     minOutputAmount: "1001",
//     maxOutputAmount: "2500",
//   },
// ];
