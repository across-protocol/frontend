import { PopulatedTransaction } from "ethers";

import { CrossSwapQuotes } from "../../_dexes/types";
import { tagIntegratorId } from "../../_integrator-id";
import { getSpokePool } from "../../_utils";
import {
  getSpokePoolPeriphery,
  getSpokePoolPeripheryProxy,
  TransferType,
} from "../../_spoke-pool-periphery";
import { extractDepositDataStruct } from "../../_dexes/utils";
import { getUniversalSwapAndBridge } from "../../_swap-and-bridge";

export async function buildCrossSwapTxForAllowanceHolder(
  crossSwapQuotes: CrossSwapQuotes,
  integratorId?: string
) {
  const { originSwapQuote, crossSwap, contracts } = crossSwapQuotes;
  const { originSwapEntryPoint, originRouter, depositEntryPoint } = contracts;
  const originChainId = crossSwap.inputToken.chainId;

  const deposit = await extractDepositDataStruct(crossSwapQuotes);

  let tx: PopulatedTransaction;
  let toAddress: string;

  // Build origin swap tx
  if (originSwapQuote) {
    if (!originSwapEntryPoint || !originRouter) {
      throw new Error(
        `'originSwapEntryPoint' and 'originRouter' need to be defined for origin swap quotes`
      );
    }
    if (originSwapEntryPoint.name === "SpokePoolPeripheryProxy") {
      const spokePoolPeripheryProxy = getSpokePoolPeripheryProxy(
        originSwapEntryPoint.address,
        originChainId
      );
      tx = await spokePoolPeripheryProxy.populateTransaction.swapAndBridge(
        {
          submissionFees: {
            amount: 0,
            recipient: crossSwap.depositor,
          },
          depositData: deposit,
          swapToken: originSwapQuote.tokenIn.address,
          exchange: originRouter.address,
          transferType: TransferType.Approval,
          swapTokenAmount: originSwapQuote.maximumAmountIn,
          minExpectedInputTokenAmount: originSwapQuote.minAmountOut,
          routerCalldata: originSwapQuote.swapTx.data,
        }
        // TODO: Add payable modifier to SpokePoolPeripheryProxy swapAndBridge function
        // {
        //   value: crossSwap.isInputNative ? originSwapQuote.maximumAmountIn : 0,
        // }
      );
      toAddress = spokePoolPeripheryProxy.address;
    } else if (originSwapEntryPoint.name === "UniversalSwapAndBridge") {
      const universalSwapAndBridge = getUniversalSwapAndBridge(
        originSwapEntryPoint.dex,
        originChainId
      );
      tx = await universalSwapAndBridge.populateTransaction.swapAndBridge(
        originSwapQuote.tokenIn.address,
        originSwapQuote.tokenOut.address,
        originSwapQuote.swapTx.data,
        originSwapQuote.maximumAmountIn,
        originSwapQuote.minAmountOut,
        {
          ...deposit,
          // Typo in the contract
          destinationChainid: deposit.destinationChainId,
        }
      );
      toAddress = universalSwapAndBridge.address;
    } else {
      throw new Error(
        `Could not build 'swapAndBridge' tx for unknown entry point contract`
      );
    }
  }
  // Build deposit tx
  else {
    if (!depositEntryPoint) {
      throw new Error(
        `'depositEntryPoint' needs to be defined for bridge quotes`
      );
    }

    if (depositEntryPoint.name === "SpokePoolPeriphery") {
      const spokePoolPeriphery = getSpokePoolPeriphery(
        depositEntryPoint.address,
        originChainId
      );
      tx = await spokePoolPeriphery.populateTransaction.deposit(
        deposit.recipient,
        deposit.inputToken,
        // deposit.outputToken, // TODO: allow for output token in periphery contract
        deposit.inputAmount,
        deposit.outputAmount,
        deposit.destinationChainId,
        deposit.exclusiveRelayer,
        deposit.quoteTimestamp,
        deposit.fillDeadline,
        deposit.exclusivityDeadline,
        deposit.message,
        {
          value: crossSwapQuotes.crossSwap.isInputNative
            ? deposit.inputAmount
            : 0,
        }
      );
      toAddress = spokePoolPeriphery.address;
    } else if (depositEntryPoint.name === "SpokePool") {
      const spokePool = getSpokePool(originChainId);
      tx = await spokePool.populateTransaction.depositV3(
        deposit.depositor,
        deposit.recipient,
        deposit.inputToken,
        deposit.outputToken,
        deposit.inputAmount,
        deposit.outputAmount,
        deposit.destinationChainId,
        deposit.exclusiveRelayer,
        deposit.quoteTimestamp,
        deposit.fillDeadline,
        deposit.exclusivityDeadline,
        deposit.message,
        {
          value: crossSwapQuotes.crossSwap.isInputNative
            ? deposit.inputAmount
            : 0,
        }
      );
      toAddress = spokePool.address;
    } else {
      throw new Error(
        `Could not build 'deposit' tx for unknown entry point contract`
      );
    }
  }

  return {
    from: crossSwapQuotes.crossSwap.depositor,
    to: toAddress,
    data: integratorId ? tagIntegratorId(integratorId, tx.data!) : tx.data,
    value: tx.value,
  };
}
