import { PopulatedTransaction } from "ethers";
import * as sdk from "@across-protocol/sdk";
import {
  createNoopSigner,
  address,
  compileTransaction,
  getBase64EncodedWireTransaction,
  pipe,
  appendTransactionMessageInstruction,
  fetchAddressesForLookupTables,
  AddressesByLookupTableAddress,
} from "@solana/kit";
import { compressTransactionMessageUsingAddressLookupTables } from "@solana/transaction-messages";
import { getAddMemoInstruction } from "@solana-program/memo";

import { CrossSwapQuotes, EvmSwapTxn, isSvmSwapTxn } from "../../_dexes/types";
import {
  assertValidIntegratorId,
  tagIntegratorId,
  tagSwapApiMarker,
} from "../../_integrator-id";
import { getSpokePool, getSpokePoolAddress } from "../../_utils";
import {
  getSpokePoolPeriphery,
  TransferType,
} from "../../_spoke-pool-periphery";
import {
  extractDepositDataStruct,
  extractSwapAndDepositDataStruct,
} from "../../_dexes/utils";
import { JupiterSwapIxs } from "../../_dexes/jupiter/utils/api";
import { appendJupiterIxs } from "../../_dexes/jupiter/utils/transaction-builder";
import { getUniversalSwapAndBridge } from "../../_swap-and-bridge";
import { getSVMRpc } from "../../_providers";
import { getFillDeadlineBuffer } from "../../_fill-deadline";

export async function buildCrossSwapTxForAllowanceHolder(
  crossSwapQuotes: CrossSwapQuotes,
  integratorId?: string
) {
  const { crossSwap } = crossSwapQuotes;

  if (crossSwap.isOriginSvm) {
    return _buildDepositTxForAllowanceHolderSvm(crossSwapQuotes, integratorId);
  } else {
    return _buildDepositTxForAllowanceHolderEvm(crossSwapQuotes, integratorId);
  }
}

async function _buildDepositTxForAllowanceHolderEvm(
  crossSwapQuotes: CrossSwapQuotes,
  integratorId?: string
) {
  const { originSwapQuote, crossSwap, contracts } = crossSwapQuotes;
  const { originSwapEntryPoint, originRouter, depositEntryPoint } = contracts;
  const originChainId = crossSwap.inputToken.chainId;
  const destinationChainId = crossSwap.outputToken.chainId;
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
      originRouter.transferType ?? TransferType.Approval
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
              .toAddressType(
                swapAndDepositData.depositData.inputToken,
                originChainId
              )
              .toEvmAddress(),
            outputToken: sdk.utils
              .toAddressType(
                swapAndDepositData.depositData.outputToken,
                destinationChainId
              )
              .toBytes32(),
            depositor: sdk.utils
              .toAddressType(
                swapAndDepositData.depositData.depositor,
                originChainId
              )
              .toEvmAddress(),
            recipient: sdk.utils
              .toAddressType(
                swapAndDepositData.depositData.recipient,
                destinationChainId
              )
              .toBytes32(),
            exclusiveRelayer: sdk.utils
              .toAddressType(
                swapAndDepositData.depositData.exclusiveRelayer,
                destinationChainId
              )
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
        originSwapEntryPoint.dex || "unknown",
        originChainId
      );
      if (originSwapQuote.swapTxns.length !== 1) {
        throw new Error(
          "Expected exactly 1 swap transaction for origin swap via `UniversalSwapAndBridge`"
        );
      }
      const swapTxn = originSwapQuote.swapTxns[0] as EvmSwapTxn;
      tx = await universalSwapAndBridge.populateTransaction.swapAndBridge(
        originSwapQuote.tokenIn.address,
        originSwapQuote.tokenOut.address,
        swapTxn.data,
        originSwapQuote.maximumAmountIn,
        originSwapQuote.minAmountOut,
        {
          ...swapAndDepositData.depositData,
          depositor: sdk.utils
            .toAddressType(
              swapAndDepositData.depositData.depositor,
              originChainId
            )
            .toEvmAddress(),
          recipient: sdk.utils
            .toAddressType(
              swapAndDepositData.depositData.recipient,
              destinationChainId
            )
            .toEvmAddress(),
          outputToken: sdk.utils
            .toAddressType(
              swapAndDepositData.depositData.outputToken,
              destinationChainId
            )
            .toEvmAddress(),
          exclusiveRelayer: sdk.utils
            .toAddressType(
              swapAndDepositData.depositData.exclusiveRelayer,
              destinationChainId
            )
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
        sdk.utils
          .toAddressType(baseDepositData.recipient, destinationChainId)
          .toBytes32(),
        sdk.utils
          .toAddressType(baseDepositData.inputToken, originChainId)
          .toEvmAddress(),
        baseDepositData.inputAmount.toString(),
        sdk.utils
          .toAddressType(baseDepositData.outputToken, destinationChainId)
          .toBytes32(),
        baseDepositData.outputAmount.toString(),
        baseDepositData.destinationChainId,
        sdk.utils
          .toAddressType(baseDepositData.exclusiveRelayer, destinationChainId)
          .toBytes32(),
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
        sdk.utils
          .toAddressType(baseDepositData.depositor, originChainId)
          .toBytes32(),
        sdk.utils
          .toAddressType(baseDepositData.recipient, destinationChainId)
          .toBytes32(),
        sdk.utils
          .toAddressType(baseDepositData.inputToken, originChainId)
          .toBytes32(),
        sdk.utils
          .toAddressType(baseDepositData.outputToken, destinationChainId)
          .toBytes32(),
        baseDepositData.inputAmount,
        baseDepositData.outputAmount,
        baseDepositData.destinationChainId,
        sdk.utils
          .toAddressType(baseDepositData.exclusiveRelayer, destinationChainId)
          .toBytes32(),
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
  const txDataWithIntegratorId = integratorId
    ? tagIntegratorId(integratorId, tx.data!)
    : tx.data!;
  const txDataWithSwapApiMarker = tagSwapApiMarker(txDataWithIntegratorId);

  return {
    chainId: originChainId,
    from: crossSwapQuotes.crossSwap.depositor,
    to: toAddress,
    data: txDataWithSwapApiMarker,
    value: tx.value,
    ecosystem: "evm",
  } as const;
}

async function _buildDepositTxForAllowanceHolderSvm(
  crossSwapQuotes: CrossSwapQuotes,
  integratorId?: string
) {
  const { originSwapQuote, crossSwap } = crossSwapQuotes;
  const originChainId = crossSwap.inputToken.chainId;
  const destinationChainId = crossSwap.outputToken.chainId;
  const rpcClient = getSVMRpc(originChainId);

  if (crossSwapQuotes.bridgeQuote.provider !== "across") {
    throw new Error(
      "Can not build deposit tx on SVM for non-Across bridge quotes"
    );
  }

  // Build deposit instruction parameters
  const spokePoolProgramId = address(getSpokePoolAddress(originChainId));
  const depositor = address(
    sdk.utils.toAddressType(crossSwap.depositor, originChainId).toBase58()
  );
  const recipient = address(
    // FIXME: When we support messages, recipient must be the MulticallHandler
    sdk.utils.toAddressType(crossSwap.recipient, destinationChainId).toBase58()
  );

  const inputToken = address(
    sdk.utils
      .toAddressType(
        crossSwapQuotes.bridgeQuote.inputToken.address,
        originChainId
      )
      .toBase58()
  );
  const outputToken = address(
    sdk.utils
      .toAddressType(
        crossSwapQuotes.bridgeQuote.outputToken.address,
        destinationChainId
      )
      .toBase58()
  );
  // For A2B: use swap expected output, for B2B: use bridge input amount
  const inputAmount = BigInt(
    originSwapQuote
      ? originSwapQuote.expectedAmountOut.toString()
      : crossSwapQuotes.bridgeQuote.inputAmount.toString()
  );
  const outputAmount = sdk.arch.svm.bigToU8a32(
    crossSwapQuotes.bridgeQuote.outputAmount
  );
  const exclusiveRelayer = address(
    sdk.utils
      .toAddressType(
        crossSwapQuotes.bridgeQuote.suggestedFees.exclusiveRelayer,
        destinationChainId
      )
      .toBase58()
  );
  const quoteTimestamp = crossSwapQuotes.bridgeQuote.suggestedFees.timestamp;
  const fillDeadline =
    sdk.utils.getCurrentTime() + getFillDeadlineBuffer(destinationChainId);
  const exclusivityParameter =
    crossSwapQuotes.bridgeQuote.suggestedFees.exclusivityDeadline;
  // FIXME: Temporarily hardcoding empty messages.
  // Fix when we have a workaround for transaction size limitations
  const message = Uint8Array.from(Buffer.from("", "hex"));
  // Future implementation should use:
  // const message = Uint8Array.from(
  //   Buffer.from(crossSwapQuotes.bridgeQuote.message?.slice(2) ?? "", "hex")
  // );

  const noopSigner = createNoopSigner(depositor);
  const depositDataSeed: Parameters<
    typeof sdk.arch.svm.getDepositDelegatePda
  >[0] = {
    depositor,
    recipient,
    inputToken,
    outputToken,
    inputAmount,
    outputAmount,
    destinationChainId: BigInt(destinationChainId),
    exclusiveRelayer,
    quoteTimestamp: BigInt(quoteTimestamp),
    fillDeadline: BigInt(fillDeadline),
    exclusivityParameter: BigInt(exclusivityParameter),
    message,
  };

  const depositDelegatePda = await sdk.arch.svm.getDepositDelegatePda(
    depositDataSeed,
    spokePoolProgramId
  );
  const statePda = await sdk.arch.svm.getStatePda(spokePoolProgramId);
  const eventAuthorityPda =
    await sdk.arch.svm.getEventAuthority(spokePoolProgramId);
  const vaultPda = await sdk.arch.svm.getAssociatedTokenAddress(
    sdk.utils.toAddressType(statePda, originChainId).forceSvmAddress(),
    sdk.utils.toAddressType(inputToken, originChainId).forceSvmAddress()
  );
  const depositorTokenAccount = await sdk.arch.svm.getAssociatedTokenAddress(
    sdk.utils.toAddressType(depositor, originChainId).forceSvmAddress(),
    sdk.utils.toAddressType(inputToken, originChainId).forceSvmAddress()
  );
  const tokenDecimals = crossSwapQuotes.bridgeQuote.inputToken.decimals;

  const depositIx = await sdk.arch.svm.createDepositInstruction(
    noopSigner,
    rpcClient,
    {
      signer: noopSigner,
      state: statePda,
      delegate: depositDelegatePda,
      depositorTokenAccount: depositorTokenAccount,
      vault: vaultPda,
      eventAuthority: eventAuthorityPda,
      program: spokePoolProgramId,
      mint: inputToken,
      depositor,
      inputToken,
      outputToken,
      recipient,
      inputAmount,
      outputAmount,
      destinationChainId,
      exclusiveRelayer,
      quoteTimestamp: Number(quoteTimestamp),
      fillDeadline,
      exclusivityParameter,
      message,
      // TODO: make `tokenProgram`, `associatedTokenProgram`, `systemProgram`
      // dependent on `inputToken` somehow. For now we only support USDC and use
      // default programs addresses of SDK.
    },
    tokenDecimals
  );

  if (integratorId) {
    assertValidIntegratorId(integratorId);
  }

  let tx = await sdk.arch.svm.createDefaultTransaction(rpcClient, noopSigner);

  // Get swap instructions for A2B flows (if present)
  const swapTxn = originSwapQuote?.swapTxns[0];
  const swapIxs =
    swapTxn && isSvmSwapTxn(swapTxn) ? swapTxn.instructions : undefined;
  const swapLookupTables =
    swapTxn && isSvmSwapTxn(swapTxn) ? swapTxn.lookupTables : undefined;
  const swapProvider = originSwapQuote?.swapProvider.name;

  tx = pipe(
    tx,
    // Add swap instructions if present
    (tx) => {
      if (!swapIxs) return tx;

      switch (swapProvider) {
        case "jupiter":
          return appendJupiterIxs(tx, swapIxs as JupiterSwapIxs);
        default:
          throw new Error(`Unsupported SVM swap provider: ${swapProvider}`);
      }
    },
    // Add all deposit instructions
    (tx) =>
      depositIx.instructions.reduce(
        (acc, instruction) =>
          appendTransactionMessageInstruction(instruction, acc),
        tx
      ),
    // Add integrator memo if provided
    (tx) =>
      integratorId
        ? appendTransactionMessageInstruction(
            getAddMemoInstruction({ memo: integratorId }),
            tx
          )
        : tx
  );

  // Fetch address lookup tables if present to reduce txn size
  const addressesByLookup: AddressesByLookupTableAddress = swapLookupTables
    ? await fetchAddressesForLookupTables(swapLookupTables, rpcClient)
    : {};

  // Compile transaction with address lookup table compression
  const hasLookupTables = Object.keys(addressesByLookup).length > 0;

  let compiledTx;
  if (hasLookupTables) {
    const compressedMessage =
      compressTransactionMessageUsingAddressLookupTables(tx, addressesByLookup);
    compiledTx = compileTransaction(compressedMessage);
  } else {
    compiledTx = compileTransaction(tx);
  }

  const base64EncodedWireTransaction =
    getBase64EncodedWireTransaction(compiledTx);

  return {
    chainId: originChainId,
    to: spokePoolProgramId,
    data: base64EncodedWireTransaction,
    ecosystem: "svm",
  } as const;
}
