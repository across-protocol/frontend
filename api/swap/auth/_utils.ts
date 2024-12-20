import {
  CrossSwapQuotes,
  DepositEntryPointContract,
  OriginSwapEntryPointContract,
} from "../../_dexes/types";
import { getTransferWithAuthTypedData } from "../../_transfer-with-auth";
import {
  getDepositTypedData,
  getSwapAndDepositTypedData,
  TransferType,
} from "../../_spoke-pool-periphery";
import { extractDepositDataStruct } from "../../_dexes/utils";
import { BigNumber, utils } from "ethers";

export async function buildAuthTxPayload(
  crossSwapQuotes: CrossSwapQuotes,
  authDeadline: number, // maybe milliseconds
  authStart = 0 // maybe milliseconds
) {
  const { originSwapQuote, bridgeQuote, crossSwap, contracts } =
    crossSwapQuotes;
  const originChainId = crossSwap.inputToken.chainId;
  const { originSwapEntryPoint, depositEntryPoint, originRouter } = contracts;

  const baseDepositData = await extractDepositDataStruct(crossSwapQuotes);

  let entryPointContract:
    | DepositEntryPointContract
    | OriginSwapEntryPointContract;
  let getDepositTypedDataPromise:
    | ReturnType<typeof getDepositTypedData>
    | ReturnType<typeof getSwapAndDepositTypedData>;
  let methodName: string;

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

    entryPointContract = originSwapEntryPoint;
    getDepositTypedDataPromise = getSwapAndDepositTypedData({
      swapAndDepositData: {
        // TODO: Make this dynamic
        submissionFees: {
          amount: BigNumber.from(0),
          recipient: crossSwapQuotes.crossSwap.depositor,
        },
        depositData: baseDepositData,
        swapToken: originSwapQuote.tokenIn.address,
        swapTokenAmount: originSwapQuote.maximumAmountIn,
        minExpectedInputTokenAmount: originSwapQuote.minAmountOut,
        routerCalldata: originSwapQuote.swapTx.data,
        exchange: originRouter.address,
        transferType:
          originRouter.name === "UniswapV3UniversalRouter"
            ? TransferType.Transfer
            : TransferType.Approval,
      },
      chainId: originChainId,
    });
    methodName = "swapAndBridgeWithAuthorization";
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

    entryPointContract = depositEntryPoint;
    getDepositTypedDataPromise = getDepositTypedData({
      depositData: {
        // TODO: Make this dynamic
        submissionFees: {
          amount: BigNumber.from(0),
          recipient: crossSwap.depositor,
        },
        baseDepositData,
        inputAmount: BigNumber.from(bridgeQuote.inputAmount),
      },
      chainId: originChainId,
    });
    methodName = "depositWithAuthorization";
  }

  // random non-sequesntial nonce
  const nonce = utils.hexlify(utils.randomBytes(32));

  const [authTypedData, depositTypedData] = await Promise.all([
    getTransferWithAuthTypedData({
      tokenAddress:
        originSwapQuote?.tokenIn.address || bridgeQuote.inputToken.address,
      chainId: originChainId,
      ownerAddress: crossSwap.depositor,
      spenderAddress: entryPointContract.address,
      value: originSwapQuote?.maximumAmountIn || bridgeQuote.inputAmount,
      nonce,
      validAfter: authStart,
      validBefore: authDeadline,
    }),
    getDepositTypedDataPromise,
  ]);
  return {
    eip712: {
      transferWithAuthorization: authTypedData.eip712,
      deposit: depositTypedData.eip712,
    },
    swapTx: {
      chainId: originChainId,
      to: entryPointContract.address,
      methodName,
    },
  };
}
