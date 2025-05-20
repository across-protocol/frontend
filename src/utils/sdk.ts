import { BigNumber, providers } from "ethers";
import { EVMBlockFinder } from "@across-protocol/sdk/dist/esm/arch/evm/BlockUtils";
import { toAddress as _toAddress } from "@across-protocol/sdk/dist/esm/utils/AddressUtils";
import { EVMBlockFinder } from "@across-protocol/sdk/dist/esm/arch/evm/BlockUtils";

export { isDefined } from "@across-protocol/sdk/dist/esm/utils/TypeGuards";
export {
  bnUint256Max,
  bnUint32Max,
  bnZero,
} from "@across-protocol/sdk/dist/esm/utils/BigNumberUtils";
export { mapAsync } from "@across-protocol/sdk/dist/esm/utils/ArrayUtils";
export { getCurrentTime } from "@across-protocol/sdk/dist/esm/utils/TimeUtils";
export {
  isBridgedUsdc,
  isStablecoin,
} from "@across-protocol/sdk/dist/esm/utils/TokenUtils";
export { BRIDGED_USDC_SYMBOLS } from "@across-protocol/sdk/dist/esm/constants";
export {
  toBytes32,
  compareAddressesSimple,
  toAddress,
  isContractDeployedToAddress,
  toAddressType,
} from "@across-protocol/sdk/dist/esm/utils/AddressUtils";
export {
  getNativeTokenSymbol,
  chainIsLens,
  chainIsSvm,
  chainIsEvm,
} from "@across-protocol/sdk/dist/esm/utils/NetworkUtils";
export { getMessageHash } from "@across-protocol/sdk/dist/esm/utils/SpokeUtils";
export { SvmCpiEventsClient } from "@across-protocol/sdk/dist/esm/arch/svm/eventsClient";
export { findFillEvent } from "@across-protocol/sdk/dist/esm/arch/svm/SpokeUtils";

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

export function toAddressSafe(address: string) {
  try {
    return _toAddress(address);
  } catch (e) {
    return address;
  }
}
