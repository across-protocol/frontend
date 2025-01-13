import { BigNumber, providers } from "ethers";
import { BlockFinder } from "@across-protocol/sdk/dist/esm/utils/BlockUtils";

export { isDefined } from "@across-protocol/sdk/dist/esm/utils/TypeGuards";
export { isContractDeployedToAddress } from "@across-protocol/sdk/dist/esm/utils/AddressUtils";
export {
  bnUint256Max,
  bnUint32Max,
  bnZero,
} from "@across-protocol/sdk/dist/esm/utils/BigNumberUtils";
export { mapAsync } from "@across-protocol/sdk/dist/esm/utils/ArrayUtils";
export { getCurrentTime } from "@across-protocol/sdk/dist/esm/utils/TimeUtils";
export { isBridgedUsdc } from "@across-protocol/sdk/dist/esm/utils/TokenUtils";
export { BRIDGED_USDC_SYMBOLS } from "@across-protocol/sdk/dist/esm/constants";
export {
  getNativeTokenSymbol,
  chainIsLens,
} from "@across-protocol/sdk/dist/esm/utils/NetworkUtils";

export function getUpdateV3DepositTypedData(
  depositId: number,
  originChainId: number,
  updatedOutputAmount: BigNumber,
  updatedRecipient: string,
  updatedMessage: string
) {
  return {
    types: {
      UpdateDepositDetails: [
        { name: "depositId", type: "uint32" },
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
      depositId: depositId,
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
  const blockFinder = new BlockFinder(provider);
  const { number: blockNumberForTimestamp } =
    await blockFinder.getBlockForTimestamp(timestamp);
  return blockNumberForTimestamp;
}
