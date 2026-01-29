import { BigNumber, providers } from "ethers";
import { EVMBlockFinder } from "@across-protocol/sdk/dist/esm/src/arch/evm/BlockUtils";
import { toAddressType as _toAddressType } from "@across-protocol/sdk/dist/esm/src/utils/AddressUtils";
export { getAssociatedTokenAddress } from "@across-protocol/sdk/dist/esm/src/arch/svm/SpokeUtils";
export { toAddress } from "@across-protocol/sdk/dist/esm/src/arch/svm/utils";
export { getCCTPDepositAccounts } from "@across-protocol/sdk/dist/esm/src/arch/svm/SpokeUtils";

export { SVMBlockFinder } from "@across-protocol/sdk/dist/esm/src/arch/svm/BlockUtils";
export { isDefined } from "@across-protocol/sdk/dist/esm/src/utils/TypeGuards";
export {
  bnUint256Max,
  bnUint32Max,
  bnZero,
} from "@across-protocol/sdk/dist/esm/src/utils/BigNumberUtils";
export { mapAsync } from "@across-protocol/sdk/dist/esm/src/utils/ArrayUtils";
export { getCurrentTime } from "@across-protocol/sdk/dist/esm/src/utils/TimeUtils";
export {
  isBridgedUsdc,
  isStablecoin,
} from "@across-protocol/sdk/dist/esm/src/utils/TokenUtils";
export { BRIDGED_USDC_SYMBOLS } from "@across-protocol/sdk/dist/esm/src/constants";
export {
  toBytes32,
  compareAddressesSimple,
  isContractDeployedToAddress,
  toAddressType,
  Address,
} from "@across-protocol/sdk/dist/esm/src/utils/AddressUtils";

export {
  getNativeTokenSymbol,
  chainIsSvm,
  chainIsEvm,
  chainIsProd,
} from "@across-protocol/sdk/dist/esm/src/utils/NetworkUtils";
export { getMessageHash } from "@across-protocol/sdk/dist/esm/src/utils/SpokeUtils";
export { SvmCpiEventsClient } from "@across-protocol/sdk/dist/esm/src/arch/svm/eventsClient";
export { findFillEvent } from "@across-protocol/sdk/dist/esm/src/arch/svm/SpokeUtils";
export {
  bigToU8a32,
  getNearestSlotTime,
} from "@across-protocol/sdk/dist/esm/src/arch/svm/utils";
export { paginatedEventQuery } from "@across-protocol/sdk/dist/esm/src/utils/EventUtils";
export { getCctpDestinationChainFromDomain } from "@across-protocol/sdk/dist/esm/src/utils/CCTPUtils";
export type { SVMProvider } from "@across-protocol/sdk/dist/esm/src/arch/svm/types";

export function getUpdateV3DepositTypedData(
  depositId: string,
  originChainId: number,
  updatedOutputAmount: BigNumber,
  updatedRecipient: string,
  updatedMessage: string
) {
  return {
    types: {
      UpdateDepositDetails: [
        { name: "depositId", type: "uint256" },
        { name: "originChainId", type: "uint256" },
        { name: "updatedOutputAmount", type: "uint256" },
        { name: "updatedRecipient", type: "address" },
        { name: "updatedMessage", type: "bytes" },
      ],
    },
    primaryType: "UpdateDepositDetails",
    domain: {
      name: "ACROSS-V2",
      version: "1.0.0",
      chainId: originChainId,
    },
    message: {
      depositId: BigNumber.from(depositId),
      originChainId: originChainId,
      updatedOutputAmount: updatedOutputAmount,
      updatedRecipient: updatedRecipient,
      updatedMessage: updatedMessage,
    },
  };
}

export async function getBlockForTimestamp(
  provider: providers.JsonRpcProvider,
  timestamp: number
) {
  const blockFinder = new EVMBlockFinder(provider);
  const { number: blockNumberForTimestamp } =
    await blockFinder.getBlockForTimestamp(timestamp);
  return blockNumberForTimestamp;
}

export function toAddressSafe(address: string, chainId: number) {
  try {
    return _toAddressType(address, chainId);
  } catch (e) {
    return address;
  }
}
