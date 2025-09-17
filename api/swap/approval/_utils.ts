import { PopulatedTransaction } from "ethers";
import * as sdk from "@across-protocol/sdk";
import {
  createNoopSigner,
  address,
  compileTransaction,
  getBase64EncodedWireTransaction,
  pipe,
  appendTransactionMessageInstruction,
  AccountRole,
} from "@solana/kit";
import type { Address } from "@solana/kit";
import { compressTransactionMessageUsingAddressLookupTables } from "@solana/transaction-messages";
import { getAddMemoInstruction } from "@solana-program/memo";

import { CrossSwapQuotes } from "../../_dexes/types";
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
import { getUniversalSwapAndBridge } from "../../_swap-and-bridge";
import { getSVMRpc } from "../../_providers";
import { getFillDeadlineBuffer } from "../../_fill-deadline";

// Jupiter API types
interface JupiterInstructionAccount {
  pubkey: string;
  isSigner: boolean;
  isWritable: boolean;
}

interface JupiterInstruction {
  programId: string;
  accounts: JupiterInstructionAccount[];
  data: string;
}

interface JupiterSwapInstructionsResponse {
  tokenLedgerInstruction?: JupiterInstruction;
  computeBudgetInstructions: JupiterInstruction[];
  setupInstructions: JupiterInstruction[];
  swapInstruction: JupiterInstruction;
  cleanupInstruction?: JupiterInstruction;
  addressLookupTableAddresses: string[];
  prioritizationFeeLamports?: number;
  computeUnitLimit?: number;
}

// Helper function to fetch address lookup table accounts
async function getAddressLookupTableAccounts(
  rpcClient: any,
  addresses: string[]
) {
  if (addresses.length === 0) return [];

  try {
    const lookupTableAccountsData = await Promise.all(
      addresses.map(async (addr) => {
        const response = await rpcClient.getAccountInfo(address(addr)).send();
        if (response.value?.data) {
          return {
            address: address(addr),
            data: response.value.data,
          };
        }
        return null;
      })
    );

    return lookupTableAccountsData
      .filter((account) => account !== null)
      .map((account) => ({
        address: account!.address,
        // The actual lookup table parsing would be done by the Solana SDK
        // For now we just pass the raw data and let the compression function handle it
        addresses: [] as Address[], // This gets populated by the decompile function
      }));
  } catch (error) {
    console.warn("Failed to fetch address lookup table accounts:", error);
    return [];
  }
}

// Helper function to deserialize Jupiter instruction for @solana/kit
function deserializeJupiterInstruction(instruction: JupiterInstruction) {
  return {
    programAddress: address(instruction.programId),
    accounts: instruction.accounts.map((acc) => ({
      address: address(acc.pubkey),
      role: acc.isWritable
        ? acc.isSigner
          ? AccountRole.WRITABLE_SIGNER
          : AccountRole.WRITABLE
        : acc.isSigner
          ? AccountRole.READONLY_SIGNER
          : AccountRole.READONLY,
    })),
    data: new Uint8Array(Buffer.from(instruction.data, "base64")),
  };
}

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
      tx = await universalSwapAndBridge.populateTransaction.swapAndBridge(
        originSwapQuote.tokenIn.address,
        originSwapQuote.tokenOut.address,
        originSwapQuote.swapTxns[0].data,
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

  // Parse and validate Jupiter instructions for A2B flows (if present)
  let jupiterInstructionsResponse: JupiterSwapInstructionsResponse | null =
    null;

  if (originSwapQuote) {
    try {
      const rawData = originSwapQuote.swapTxns[0].data;
      jupiterInstructionsResponse = JSON.parse(
        rawData
      ) as JupiterSwapInstructionsResponse;

      // Validate required fields
      if (!jupiterInstructionsResponse.swapInstruction) {
        throw new Error("Missing required swapInstruction in Jupiter response");
      }
      if (
        !Array.isArray(jupiterInstructionsResponse.computeBudgetInstructions)
      ) {
        jupiterInstructionsResponse.computeBudgetInstructions = [];
      }
      if (!Array.isArray(jupiterInstructionsResponse.setupInstructions)) {
        jupiterInstructionsResponse.setupInstructions = [];
      }
      if (
        !Array.isArray(jupiterInstructionsResponse.addressLookupTableAddresses)
      ) {
        jupiterInstructionsResponse.addressLookupTableAddresses = [];
      }
    } catch (error) {
      throw new Error(
        `Failed to parse Jupiter swap instructions: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // Build deposit instruction parameters
  const spokePoolProgramId = address(getSpokePoolAddress(originChainId));
  const depositor = address(
    sdk.utils.toAddressType(crossSwap.depositor, originChainId).toBase58()
  );
  const recipient = address(
    sdk.utils.toAddressType(crossSwap.recipient, destinationChainId).toBase58()
  );

  // For A2B: use Jupiter swap output token, for B2B: use original input token
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

  // For A2B: use Jupiter swap expected output, for B2B: use bridge input amount
  const inputAmount = BigInt(
    originSwapQuote
      ? originSwapQuote.expectedAmountOut.toString() // Fixed: use expectedAmountOut instead of minAmountOut
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
  const message = Uint8Array.from(
    Buffer.from(crossSwapQuotes.bridgeQuote.message ?? "0x", "hex")
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

  // Debug logging
  console.log("SVM Transaction Debug Info:", {
    originChainId,
    depositor: depositor.toString(),
    inputToken: inputToken.toString(),
    inputAmount: inputAmount.toString(),
    tokenDecimals,
    depositorTokenAccount: depositorTokenAccount.toString(),
    hasSwap: !!jupiterInstructionsResponse,
  });

  const depositInstruction = await sdk.arch.svm.createDepositInstruction(
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
    },
    tokenDecimals
  );

  if (integratorId) {
    assertValidIntegratorId(integratorId);
  }

  // Build transaction using @solana/kit patterns
  // let tx = await createDefaultSvmTransaction(rpcClient, noopSigner);
  let tx = await sdk.arch.svm.createDefaultTransaction(rpcClient, noopSigner);

  // Fetch address lookup tables if present
  let addressLookupTables: any[] = [];
  if (
    jupiterInstructionsResponse?.addressLookupTableAddresses &&
    jupiterInstructionsResponse.addressLookupTableAddresses.length > 0
  ) {
    console.log(
      "Fetching address lookup tables:",
      jupiterInstructionsResponse.addressLookupTableAddresses.length
    );
    addressLookupTables = await getAddressLookupTableAccounts(
      rpcClient,
      jupiterInstructionsResponse.addressLookupTableAddresses
    );
    console.log("Fetched address lookup tables:", addressLookupTables.length);
  }

  // Build instructions in the correct order using pipe
  tx = pipe(
    tx,
    // Add compute budget instructions first
    (tx) => {
      if (jupiterInstructionsResponse?.computeBudgetInstructions) {
        return jupiterInstructionsResponse.computeBudgetInstructions.reduce(
          (acc, instruction) =>
            appendTransactionMessageInstruction(
              deserializeJupiterInstruction(instruction),
              acc
            ),
          tx
        );
      }
      return tx;
    },

    // Add setup instructions (token account creation, etc.)
    (tx) => {
      if (jupiterInstructionsResponse?.setupInstructions) {
        return jupiterInstructionsResponse.setupInstructions.reduce(
          (acc, instruction) =>
            appendTransactionMessageInstruction(
              deserializeJupiterInstruction(instruction),
              acc
            ),
          tx
        );
      }
      return tx;
    },

    // Add token ledger instruction if present
    (tx) => {
      if (jupiterInstructionsResponse?.tokenLedgerInstruction) {
        return appendTransactionMessageInstruction(
          deserializeJupiterInstruction(
            jupiterInstructionsResponse.tokenLedgerInstruction
          ),
          tx
        );
      }
      return tx;
    },

    // Add the main swap instruction
    (tx) => {
      if (jupiterInstructionsResponse?.swapInstruction) {
        return appendTransactionMessageInstruction(
          deserializeJupiterInstruction(
            jupiterInstructionsResponse.swapInstruction
          ),
          tx
        );
      }
      return tx;
    },

    // Add cleanup instruction if present
    (tx) => {
      if (jupiterInstructionsResponse?.cleanupInstruction) {
        return appendTransactionMessageInstruction(
          deserializeJupiterInstruction(
            jupiterInstructionsResponse.cleanupInstruction
          ),
          tx
        );
      }
      return tx;
    },

    // Add all deposit instructions (there might be multiple)
    (tx) => {
      return depositInstruction.instructions.reduce(
        (acc, instruction) =>
          appendTransactionMessageInstruction(instruction, acc),
        tx
      );
    },

    // Add integrator memo if provided
    (tx) => {
      if (integratorId) {
        return appendTransactionMessageInstruction(
          getAddMemoInstruction({ memo: integratorId }),
          tx
        );
      }
      return tx;
    }
  );

  // Debug transaction before compilation
  console.log("Transaction before compilation:", {
    instructionCount: tx.instructions.length,
    instructions: tx.instructions.map((ix, i) => ({
      index: i,
      programAddress: ix.programAddress.toString(),
      accountCount: ix.accounts?.length || 0,
      accounts:
        ix.accounts?.map((acc) => ({
          address: acc.address.toString(),
          role: acc.role,
        })) || [],
    })),
  });

  // Compile transaction with address lookup table compression
  let compiledTx;
  if (addressLookupTables.length > 0) {
    console.log("Compressing transaction using address lookup tables");
    try {
      // Use the compression function directly on the transaction message
      const compressedMessage =
        compressTransactionMessageUsingAddressLookupTables(
          tx,
          addressLookupTables
        );

      // Compile the compressed message
      compiledTx = compileTransaction(compressedMessage);
      console.log("Successfully compressed transaction with ALTs");
    } catch (error) {
      console.warn(
        "Failed to compress transaction with ALTs, falling back to normal compilation:",
        error
      );
      compiledTx = compileTransaction(tx);
    }
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
