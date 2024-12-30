import { PopulatedTransaction } from "ethers";

import { CrossSwapQuotes } from "../../_dexes/types";
import { tagIntegratorId } from "../../_integrator-id";
import { getSpokePool } from "../../_utils";
import {
  getSpokePoolPeriphery,
  getSpokePoolPeripheryProxy,
} from "../../_spoke-pool-periphery";
import {
  extractDepositDataStruct,
  extractSwapAndDepositDataStruct,
} from "../../_dexes/utils";
import { getUniversalSwapAndBridge } from "../../_swap-and-bridge";

export async function buildCrossSwapTxForAllowanceHolder(
  crossSwapQuotes: CrossSwapQuotes,
  integratorId?: string
) {
  const { originSwapQuote, crossSwap, contracts } = crossSwapQuotes;
  const { originSwapEntryPoint, originRouter, depositEntryPoint } = contracts;
  const originChainId = crossSwap.inputToken.chainId;

  let tx: PopulatedTransaction;
  let toAddress: string;

  // Build origin swap tx
  if (originSwapQuote) {
    if (!originSwapEntryPoint || !originRouter) {
      throw new Error(
        `'originSwapEntryPoint' and 'originRouter' need to be defined for origin swap quotes`
      );
    }

    const swapAndDepositData =
      await extractSwapAndDepositDataStruct(crossSwapQuotes);

    if (originSwapEntryPoint.name === "SpokePoolPeripheryProxy") {
      const spokePoolPeripheryProxy = getSpokePoolPeripheryProxy(
        originSwapEntryPoint.address,
        originChainId
      );
      tx = await spokePoolPeripheryProxy.populateTransaction.swapAndBridge(
        swapAndDepositData
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
          ...swapAndDepositData.depositData,
          exclusivityDeadline:
            swapAndDepositData.depositData.exclusivityParameter,
          // Typo in the contract
          destinationChainid: swapAndDepositData.depositData.destinationChainId,
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

    const { baseDepositData } = await extractDepositDataStruct(crossSwapQuotes);

    if (
      depositEntryPoint.name === "SpokePoolPeriphery" &&
      crossSwapQuotes.crossSwap.isInputNative
    ) {
      const spokePoolPeriphery = getSpokePoolPeriphery(
        depositEntryPoint.address,
        originChainId
      );
      tx = await spokePoolPeriphery.populateTransaction.deposit(
        baseDepositData.recipient,
        baseDepositData.inputToken,
        baseDepositData.inputAmount,
        baseDepositData.outputAmount,
        baseDepositData.destinationChainId,
        baseDepositData.exclusiveRelayer,
        baseDepositData.quoteTimestamp,
        baseDepositData.fillDeadline,
        baseDepositData.exclusivityDeadline,
        baseDepositData.message,
        {
          value: baseDepositData.inputAmount,
        }
      );
      toAddress = spokePoolPeriphery.address;
    } else if (
      depositEntryPoint.name === "SpokePool" ||
      (depositEntryPoint.name === "SpokePoolPeriphery" &&
        !crossSwapQuotes.crossSwap.isInputNative)
    ) {
      const spokePool = getSpokePool(originChainId);
      tx = await spokePool.populateTransaction.depositV3(
        baseDepositData.depositor,
        baseDepositData.recipient,
        baseDepositData.inputToken,
        baseDepositData.outputToken,
        baseDepositData.inputAmount,
        baseDepositData.outputAmount,
        baseDepositData.destinationChainId,
        baseDepositData.exclusiveRelayer,
        baseDepositData.quoteTimestamp,
        baseDepositData.fillDeadline,
        baseDepositData.exclusivityDeadline,
        baseDepositData.message,
        {
          value: crossSwapQuotes.crossSwap.isInputNative
            ? baseDepositData.inputAmount
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
