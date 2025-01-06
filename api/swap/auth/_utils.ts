import {
  CrossSwapQuotes,
  DepositEntryPointContract,
  OriginSwapEntryPointContract,
} from "../../_dexes/types";
import { getReceiveWithAuthTypedData } from "../../_transfer-with-auth";
import {
  getDepositTypedData,
  getSwapAndDepositTypedData,
} from "../../_spoke-pool-periphery";
import {
  extractDepositDataStruct,
  extractSwapAndDepositDataStruct,
} from "../../_dexes/utils";
import { BigNumberish, BytesLike, utils } from "ethers";
import { SpokePoolV3PeripheryInterface } from "../../_typechain/SpokePoolV3Periphery";

export async function buildAuthTxPayload({
  crossSwapQuotes,
  authDeadline,
  authStart = 0,
  submissionFees,
}: {
  crossSwapQuotes: CrossSwapQuotes;
  authDeadline: number;
  authStart?: number;
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
        methodName: "depositWithAuthorization";
        argsWithoutSignatures: {
          signatureOwner: string;
          depositData: SpokePoolV3PeripheryInterface.DepositDataStruct;
          validAfter: BigNumberish;
          validBefore: BigNumberish;
          nonce: BytesLike;
        };
      }
    | {
        methodName: "swapAndBridgeWithAuthorization";
        argsWithoutSignatures: {
          signatureOwner: string;
          swapAndDepositData: SpokePoolV3PeripheryInterface.SwapAndDepositDataStruct;
          validAfter: BigNumberish;
          validBefore: BigNumberish;
          nonce: BytesLike;
        };
      };

  // random non-sequesntial nonce
  const nonce = utils.hexlify(utils.randomBytes(32));

  const validAfter = authStart;
  const validBefore = authDeadline;

  if (originSwapQuote) {
    if (!originSwapEntryPoint) {
      throw new Error(
        `'originSwapEntryPoint' needs to be defined for origin swap quotes`
      );
    }
    // Only SpokePoolPeriphery supports transfer with auth
    if (originSwapEntryPoint.name !== "SpokePoolPeriphery") {
      throw new Error(
        `Transfer with auth is not supported for origin swap entry point contract '${originSwapEntryPoint.name}'`
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
      methodName: "swapAndBridgeWithAuthorization",
      argsWithoutSignatures: {
        signatureOwner: crossSwap.depositor,
        swapAndDepositData,
        validAfter,
        validBefore,
        nonce,
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
        `auth is not supported for deposit entry point contract '${depositEntryPoint.name}'`
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
      methodName: "depositWithAuthorization",
      argsWithoutSignatures: {
        signatureOwner: crossSwap.depositor,
        depositData: depositDataStruct,
        validAfter,
        validBefore,
        nonce,
      },
    };
  }

  const [authTypedData, depositTypedData] = await Promise.all([
    getReceiveWithAuthTypedData({
      tokenAddress:
        originSwapQuote?.tokenIn.address || bridgeQuote.inputToken.address,
      chainId: originChainId,
      ownerAddress: crossSwap.depositor,
      spenderAddress: entryPointContract.address,
      value: originSwapQuote?.maximumAmountIn || bridgeQuote.inputAmount,
      nonce,
      validAfter,
      validBefore,
    }),
    getDepositTypedDataPromise,
  ]);

  return {
    eip712: {
      receiveWithAuthorization: authTypedData.eip712,
      deposit: depositTypedData.eip712,
    },

    swapTx: {
      chainId: originChainId,
      to: entryPointContract.address,
      ...methodNameAndArgsWithoutSignatures,
    },
  };
}
