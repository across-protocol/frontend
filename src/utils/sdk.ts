import { BigNumber, providers } from "ethers";
import { EVMBlockFinder } from "@across-protocol/sdk/dist/esm/arch/evm/BlockUtils";
import { toEvmAddress as _toAddress } from "@across-protocol/sdk/dist/esm/utils/AddressUtils";

export { isDefined } from "@across-protocol/sdk/dist/esm/utils/TypeGuards";
export { isContractDeployedToAddress } from "@across-protocol/sdk/dist/esm/utils/AddressUtils";
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
} from "@across-protocol/sdk/dist/esm/utils/AddressUtils";
export { getNativeTokenSymbol } from "@across-protocol/sdk/dist/esm/utils/NetworkUtils";

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
