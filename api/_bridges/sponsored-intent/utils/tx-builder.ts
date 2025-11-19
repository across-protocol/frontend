import { BigNumber, constants, utils } from "ethers";
import * as sdk from "@across-protocol/sdk";

import { CrossSwapQuotes } from "../../../_dexes/types";
import { getSpokePool, getSpokePoolAddress } from "../../../_spoke-pool";
import {
  assertValidIntegratorId,
  SWAP_CALLDATA_MARKER,
  tagIntegratorId,
  tagSwapApiMarker,
} from "../../../_integrator-id";
import {
  assertNoAppFee,
  assertNoSwaps,
  getHyperEvmChainId,
  getBridgeableOutputToken,
  getDepositRecipient,
} from "./common";
import { ERROR_MESSAGE_PREFIX } from "./constants";
import { getFillDeadline } from "../../../_fill-deadline";
import {
  address,
  compileTransaction,
  createNoopSigner,
  getBase64EncodedWireTransaction,
  pipe,
} from "@solana/kit";
import { appendTransactionMessageInstruction } from "@solana/transaction-messages";
import { getSVMRpc } from "../../../_providers";
import { getAddMemoInstruction } from "@solana-program/memo";

export async function buildTxEvm(params: {
  quotes: CrossSwapQuotes;
  integratorId?: string | undefined;
}) {
  const { quotes } = params;
  const { crossSwap } = quotes;
  const { inputToken } = crossSwap;

  const { deposit } = _prepDepositTx(quotes, params.integratorId);

  const spokePool = getSpokePool(inputToken.chainId);
  const evmTx = await spokePool.populateTransaction.deposit(
    deposit.depositor.toBytes32(),
    deposit.recipient.toBytes32(),
    deposit.inputToken.toBytes32(),
    deposit.outputToken.toBytes32(),
    deposit.inputAmount,
    deposit.outputAmount,
    deposit.destinationChainId,
    deposit.exclusiveRelayer.toBytes32(),
    deposit.quoteTimestamp,
    deposit.fillDeadline,
    deposit.exclusivityParameter,
    deposit.message
  );

  const txDataWithIntegratorId = params.integratorId
    ? tagIntegratorId(params.integratorId, evmTx.data!)
    : evmTx.data!;
  const txDataWithSwapApiMarker = tagSwapApiMarker(txDataWithIntegratorId);

  return {
    chainId: inputToken.chainId,
    from: crossSwap.depositor,
    to: spokePool.address,
    data: txDataWithSwapApiMarker,
    value: BigNumber.from(0),
    ecosystem: "evm" as const,
  };
}

export async function buildTxSvm(params: {
  quotes: CrossSwapQuotes;
  integratorId?: string | undefined;
}) {
  const { quotes } = params;
  const { crossSwap } = quotes;

  const { deposit } = _prepDepositTx(quotes, params.integratorId);
  const originChainId = crossSwap.inputToken.chainId;
  const rpcClient = getSVMRpc(originChainId);

  // Build deposit instruction parameters
  const spokePoolProgramId = address(
    getSpokePoolAddress(crossSwap.inputToken.chainId)
  );
  const depositor = address(deposit.depositor.toBase58());
  const recipient = address(deposit.recipient.toBase58());
  const inputToken = address(deposit.inputToken.toBase58());
  const outputToken = address(deposit.outputToken.toBase58());
  const inputAmount = BigInt(deposit.inputAmount.toString());
  const outputAmount = sdk.arch.svm.bigToU8a32(deposit.outputAmount);
  const exclusiveRelayer = address(deposit.exclusiveRelayer.toBase58());
  const quoteTimestamp = deposit.quoteTimestamp;
  const fillDeadline = deposit.fillDeadline;
  const exclusivityParameter = deposit.exclusivityParameter;
  const message = Uint8Array.from(
    Buffer.from(deposit.message?.slice(2) ?? "", "hex")
  );
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
    destinationChainId: BigInt(deposit.destinationChainId),
    exclusiveRelayer,
    quoteTimestamp: BigInt(quoteTimestamp),
    fillDeadline: BigInt(fillDeadline),
    exclusivityParameter: BigInt(exclusivityParameter),
    message,
  };
  const tokenDecimals = crossSwap.inputToken.decimals;

  // Get PDAs
  const [delegate, state, eventAuthority] = await Promise.all([
    sdk.arch.svm.getDepositDelegatePda(depositDataSeed, spokePoolProgramId),
    sdk.arch.svm.getStatePda(spokePoolProgramId),
    sdk.arch.svm.getEventAuthority(spokePoolProgramId),
  ]);
  const [vault, depositorTokenAccount] = await Promise.all([
    sdk.arch.svm.getAssociatedTokenAddress(
      sdk.utils.toAddressType(state, originChainId).forceSvmAddress(),
      sdk.utils.toAddressType(inputToken, originChainId).forceSvmAddress()
    ),
    sdk.arch.svm.getAssociatedTokenAddress(
      sdk.utils.toAddressType(depositor, originChainId).forceSvmAddress(),
      sdk.utils.toAddressType(inputToken, originChainId).forceSvmAddress()
    ),
  ]);

  // Build deposit instruction
  const depositIx = await sdk.arch.svm.createDepositInstruction(
    noopSigner,
    rpcClient,
    {
      signer: noopSigner,
      state,
      delegate,
      depositorTokenAccount,
      vault,
      eventAuthority,
      program: spokePoolProgramId,
      mint: inputToken,
      depositor,
      inputToken,
      outputToken,
      recipient,
      inputAmount,
      outputAmount,
      destinationChainId: BigInt(deposit.destinationChainId),
      exclusiveRelayer,
      quoteTimestamp,
      fillDeadline,
      exclusivityParameter,
      message,
    },
    tokenDecimals
  );

  // Build final transaction
  let tx = await sdk.arch.svm.createDefaultTransaction(rpcClient, noopSigner);
  tx = pipe(
    tx,
    // Add all deposit instructions
    (tx) =>
      depositIx.instructions.reduce(
        (acc, instruction) =>
          appendTransactionMessageInstruction(instruction, acc),
        tx
      ),
    // Add integrator memo if provided and Swap API marker
    (tx) =>
      appendTransactionMessageInstruction(
        getAddMemoInstruction({
          memo: params.integratorId
            ? utils.hexConcat([params.integratorId, SWAP_CALLDATA_MARKER])
            : SWAP_CALLDATA_MARKER,
        }),
        tx
      )
  );

  const compiledTx = compileTransaction(tx);
  const base64EncodedWireTransaction =
    getBase64EncodedWireTransaction(compiledTx);

  return {
    chainId: originChainId,
    to: spokePoolProgramId,
    data: base64EncodedWireTransaction,
    ecosystem: "svm" as const,
  };
}

function _prepDepositTx(
  quotes: CrossSwapQuotes,
  integratorId?: string | undefined
) {
  const {
    bridgeQuote,
    crossSwap,
    originSwapQuote,
    destinationSwapQuote,
    appFee,
  } = quotes;
  const { inputToken, outputToken, depositor, recipient } = crossSwap;

  assertNoAppFee({ appFee, errorMessagePrefix: ERROR_MESSAGE_PREFIX });
  assertNoSwaps({
    originSwapQuote,
    destinationSwapQuote,
    errorMessagePrefix: ERROR_MESSAGE_PREFIX,
  });

  if (integratorId) {
    assertValidIntegratorId(integratorId);
  }

  const hyperEvmChainId = getHyperEvmChainId(outputToken.chainId);
  const bridgeableOutputToken = getBridgeableOutputToken(outputToken);
  const depositRecipient = getDepositRecipient({
    outputToken,
    recipient,
  });
  const quoteTimestamp = sdk.utils.getCurrentTime() - 60;
  const fillDeadline = getFillDeadline(hyperEvmChainId, quoteTimestamp);

  const deposit = {
    depositor: sdk.utils.toAddressType(depositor, inputToken.chainId),
    recipient: sdk.utils.toAddressType(depositRecipient, hyperEvmChainId),
    inputToken: sdk.utils.toAddressType(inputToken.address, inputToken.chainId),
    outputToken: sdk.utils.toAddressType(
      bridgeableOutputToken.addresses[hyperEvmChainId],
      hyperEvmChainId
    ),
    inputAmount: bridgeQuote.inputAmount,
    outputAmount: bridgeQuote.outputAmount,
    destinationChainId: hyperEvmChainId,
    exclusiveRelayer: sdk.utils.toAddressType(
      constants.AddressZero,
      hyperEvmChainId
    ),
    quoteTimestamp,
    fillDeadline,
    exclusivityParameter: 0,
    message: bridgeQuote.message || "0x",
  };
  return {
    deposit,
  };
}
