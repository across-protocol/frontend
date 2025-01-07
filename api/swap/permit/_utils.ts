import { BigNumberish } from "ethers";

import {
  CrossSwapQuotes,
  DepositEntryPointContract,
  OriginSwapEntryPointContract,
} from "../../_dexes/types";
import { getPermitTypedData } from "../../_permit";
import {
  getDepositTypedData,
  getSwapAndDepositTypedData,
} from "../../_spoke-pool-periphery";
import {
  extractDepositDataStruct,
  extractSwapAndDepositDataStruct,
} from "../../_dexes/utils";
import { SpokePoolV3PeripheryInterface } from "../../_typechain/SpokePoolV3Periphery";

export type PermitTxPayload = Awaited<ReturnType<typeof buildPermitTxPayload>>;

export async function buildPermitTxPayload({
  crossSwapQuotes,
  permitDeadline,
  submissionFees,
}: {
  crossSwapQuotes: CrossSwapQuotes;
  permitDeadline: number;
  submissionFees?: {
    amount: BigNumberish;
    recipient: string;
  };
}) {
  const { originSwapQuote, bridgeQuote, crossSwap, contracts } =
    crossSwapQuotes;
  const originChainId = crossSwap.inputToken.chainId;
  const { originSwapEntryPoint, depositEntryPoint, originRouter } = contracts;

  let entryPointContract:
    | DepositEntryPointContract
    | OriginSwapEntryPointContract;
  let getDepositTypedDataPromise:
    | ReturnType<typeof getDepositTypedData>
    | ReturnType<typeof getSwapAndDepositTypedData>;
  let methodNameAndArgsWithoutSignatures:
    | {
        methodName: "depositWithPermit";
        argsWithoutSignatures: {
          signatureOwner: string;
          depositData: SpokePoolV3PeripheryInterface.DepositDataStruct;
          deadline: BigNumberish;
        };
      }
    | {
        methodName: "swapAndBridgeWithPermit";
        argsWithoutSignatures: {
          signatureOwner: string;
          swapAndDepositData: SpokePoolV3PeripheryInterface.SwapAndDepositDataStruct;
          deadline: BigNumberish;
        };
      };

  if (originSwapQuote) {
    if (!originSwapEntryPoint) {
      throw new Error(
        `'originSwapEntryPoint' needs to be defined for origin swap quotes`
      );
    }
    // Only SpokePoolPeriphery supports permit
    if (originSwapEntryPoint.name !== "SpokePoolPeriphery") {
      throw new Error(
        `Permit is not supported for origin swap entry point contract '${originSwapEntryPoint.name}'`
      );
    }

    if (!originRouter) {
      throw new Error(
        `'originRouter' needs to be defined for origin swap quotes`
      );
    }

    const swapAndDepositData =
      await extractSwapAndDepositDataStruct(crossSwapQuotes);
    entryPointContract = originSwapEntryPoint;
    getDepositTypedDataPromise = getSwapAndDepositTypedData({
      swapAndDepositData: swapAndDepositData,
      chainId: originChainId,
    });
    methodNameAndArgsWithoutSignatures = {
      methodName: "swapAndBridgeWithPermit",
      argsWithoutSignatures: {
        signatureOwner: crossSwap.depositor,
        swapAndDepositData,
        deadline: permitDeadline,
      },
    };
  } else {
    if (!depositEntryPoint) {
      throw new Error(
        `'depositEntryPoint' needs to be defined for bridge quotes`
      );
    }

    if (depositEntryPoint.name !== "SpokePoolPeriphery") {
      throw new Error(
        `Permit is not supported for deposit entry point contract '${depositEntryPoint.name}'`
      );
    }
    const depositDataStruct = await extractDepositDataStruct(
      crossSwapQuotes,
      submissionFees
    );
    entryPointContract = depositEntryPoint;
    getDepositTypedDataPromise = getDepositTypedData({
      depositData: depositDataStruct,
      chainId: originChainId,
    });
    methodNameAndArgsWithoutSignatures = {
      methodName: "depositWithPermit",
      argsWithoutSignatures: {
        signatureOwner: crossSwap.depositor,
        depositData: depositDataStruct,
        deadline: permitDeadline,
      },
    };
  }

  const [permitTypedData, depositTypedData] = await Promise.all([
    getPermitTypedData({
      tokenAddress:
        originSwapQuote?.tokenIn.address || bridgeQuote.inputToken.address,
      chainId: originChainId,
      ownerAddress: crossSwap.depositor,
      spenderAddress: entryPointContract.address,
      value: originSwapQuote?.maximumAmountIn || bridgeQuote.inputAmount,
      deadline: permitDeadline,
    }),
    getDepositTypedDataPromise,
  ]);
  return {
    eip712: {
      permit: permitTypedData.eip712,
      deposit: depositTypedData.eip712,
    },
    swapTx: {
      chainId: originChainId,
      to: entryPointContract.address,
      methodName: methodNameAndArgsWithoutSignatures.methodName,
      argsWithoutSignatures:
        methodNameAndArgsWithoutSignatures.argsWithoutSignatures,
    },
  };
}
