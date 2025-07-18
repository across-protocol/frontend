import { PopulatedTransaction } from "ethers";
import * as sdk from "@across-protocol/sdk";

import { CrossSwapQuotes } from "../../_dexes/types";
import { tagIntegratorId } from "../../_integrator-id";
import { getSpokePool } from "../../_utils";
import {
  getSpokePoolPeriphery,
  TransferType,
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
  const spokePool = getSpokePool(originChainId);

  let tx: PopulatedTransaction;
  let toAddress: string;

  // Build origin swap tx
  if (originSwapQuote) {
    if (!originSwapEntryPoint || !originRouter) {
      throw new Error(
        `'originSwapEntryPoint' and 'originRouter' need to be defined for origin swap quotes`
      );
    }

    const swapAndDepositData = await extractSwapAndDepositDataStruct(
      crossSwapQuotes,
      originRouter.name === "UniswapV3UniversalRouter"
        ? TransferType.Transfer
        : TransferType.Approval
    );

    if (originSwapEntryPoint.name === "SpokePoolPeriphery") {
      const spokePoolPeriphery = getSpokePoolPeriphery(
        originSwapEntryPoint.address,
        originChainId
      );
      tx = await spokePoolPeriphery.populateTransaction.swapAndBridge(
        {
          ...swapAndDepositData,
          depositData: {
            ...swapAndDepositData.depositData,
            inputToken: sdk.utils
              .toAddressType(swapAndDepositData.depositData.inputToken)
              .toEvmAddress(),
            outputToken: sdk.utils
              .toAddressType(swapAndDepositData.depositData.outputToken)
              .toBytes32(),
            depositor: sdk.utils
              .toAddressType(swapAndDepositData.depositData.depositor)
              .toEvmAddress(),
            recipient: sdk.utils
              .toAddressType(swapAndDepositData.depositData.recipient)
              .toBytes32(),
            exclusiveRelayer: sdk.utils
              .toAddressType(swapAndDepositData.depositData.exclusiveRelayer)
              .toBytes32(),
          },
        },
        {
          value: crossSwap.isInputNative ? originSwapQuote.maximumAmountIn : 0,
        }
      );
      toAddress = spokePoolPeriphery.address;
    }
    // NOTE: Left for backwards compatibility with the old `UniversalSwapAndBridge`
    // contract. Should be removed once we've migrated to the new `SpokePoolPeriphery`.
    else if (originSwapEntryPoint.name === "UniversalSwapAndBridge") {
      const universalSwapAndBridge = getUniversalSwapAndBridge(
        originSwapEntryPoint.dex,
        originChainId
      );
      if (originSwapQuote.swapTxns.length !== 1) {
        throw new Error(
          "Expected exactly 1 swap transaction for origin swap via `UniversalSwapAndBridge`"
        );
      }
      tx = await universalSwapAndBridge.populateTransaction.swapAndBridge(
        originSwapQuote.tokenIn.address,
        originSwapQuote.tokenOut.address,
        originSwapQuote.swapTxns[0].data,
        originSwapQuote.maximumAmountIn,
        originSwapQuote.minAmountOut,
        {
          ...swapAndDepositData.depositData,
          depositor: sdk.utils
            .toAddressType(swapAndDepositData.depositData.depositor)
            .toEvmAddress(),
          recipient: sdk.utils
            .toAddressType(swapAndDepositData.depositData.recipient)
            .toEvmAddress(),
          outputToken: sdk.utils
            .toAddressType(swapAndDepositData.depositData.outputToken)
            .toEvmAddress(),
          exclusiveRelayer: sdk.utils
            .toAddressType(swapAndDepositData.depositData.exclusiveRelayer)
            .toEvmAddress(),
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
      tx = await spokePoolPeriphery.populateTransaction.depositNative(
        spokePool.address,
        sdk.utils.toAddressType(baseDepositData.recipient).toBytes32(),
        sdk.utils.toAddressType(baseDepositData.inputToken).toEvmAddress(),
        baseDepositData.inputAmount.toString(),
        sdk.utils.toAddressType(baseDepositData.outputToken).toBytes32(),
        baseDepositData.outputAmount.toString(),
        baseDepositData.destinationChainId,
        sdk.utils.toAddressType(baseDepositData.exclusiveRelayer).toBytes32(),
        baseDepositData.quoteTimestamp,
        baseDepositData.fillDeadline,
        baseDepositData.exclusivityParameter,
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
      tx = await spokePool.populateTransaction.deposit(
        sdk.utils.toAddressType(baseDepositData.depositor).toBytes32(),
        sdk.utils.toAddressType(baseDepositData.recipient).toBytes32(),
        sdk.utils.toAddressType(baseDepositData.inputToken).toBytes32(),
        sdk.utils.toAddressType(baseDepositData.outputToken).toBytes32(),
        baseDepositData.inputAmount,
        baseDepositData.outputAmount,
        baseDepositData.destinationChainId,
        sdk.utils.toAddressType(baseDepositData.exclusiveRelayer).toBytes32(),
        baseDepositData.quoteTimestamp,
        baseDepositData.fillDeadline,
        baseDepositData.exclusivityParameter,
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
    data: integratorId ? tagIntegratorId(integratorId, tx.data!) : tx.data!,
    value: tx.value,
  };
}
