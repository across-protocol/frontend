import {
  CrossSwapQuotes,
  DepositEntryPointContract,
  OriginSwapEntryPointContract,
} from "../../_dexes/types";
import { getPermitTypedData } from "../../_permit";
import {
  getDepositTypedData,
  getSwapAndDepositTypedData,
  TransferType,
} from "../../_spoke-pool-periphery";
import { extractDepositDataStruct } from "../../_dexes/utils";
import { BigNumber } from "ethers";

export async function buildPermitTxPayload(
  crossSwapQuotes: CrossSwapQuotes,
  permitDeadline: number
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
    methodName = "swapAndBridgeWithPermit";
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
    methodName = "depositWithPermit";
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
      methodName,
    },
  };
}
