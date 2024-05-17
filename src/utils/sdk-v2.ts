import { BigNumber } from "ethers";

export { isDefined } from "@across-protocol/sdk-v2/dist/esm/utils/TypeGuards";
export { isContractDeployedToAddress } from "@across-protocol/sdk-v2/dist/esm/utils/AddressUtils";
export {
  bnUint256Max,
  bnUint32Max,
  bnZero,
} from "@across-protocol/sdk-v2/dist/esm/utils/BigNumberUtils";
export { mapAsync } from "@across-protocol/sdk-v2/dist/esm/utils/ArrayUtils";
export { getCurrentTime } from "@across-protocol/sdk-v2/dist/esm/utils/TimeUtils";

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
