import { LogDescription } from "ethers/lib/utils";
import axios from "axios";

import { getConfig } from "./config";
import { getBlockForTimestamp, isDefined } from "./sdk";
import { getProvider, getSVMProvider } from "./providers";
import { SpokePool__factory } from "./typechain";
import { rewardsApiUrl } from "./constants";
import {
  DepositLog,
  FillLog,
} from "views/DepositStatus/hooks/useDepositTracking_new/types";

const config = getConfig();

export class NoFundsDepositedLogError extends Error {
  constructor(depositTxHash: string, chainId: number) {
    super(
      `Could not parse log FundsDeposited in tx ${depositTxHash} on chain ${chainId}`
    );
  }
}

export class NoFilledRelayLogError extends Error {
  constructor(depositId: number, chainId: number) {
    super(
      `Could find related FilledV3Relay for Deposit #${depositId} on chain ${chainId}`
    );
  }
}

export function parseFundsDepositedLog(
  logs: Array<{
    topics: string[];
    data: string;
  }>
): DepositLog | undefined {
  const spokePoolIface = SpokePool__factory.createInterface();
  const parsedLogs = logs.flatMap((log) => {
    try {
      return spokePoolIface.parseLog(log);
    } catch (e) {
      return [];
    }
  });
  return parsedLogs.find(({ name }) =>
    [
      "V3FundsDeposited", // NOTE: kept for backwards compatibility
      "FundsDeposited", // NOTE: this is the new name for the event
    ].includes(name)
  ) as unknown as DepositLog;
}

export function parseFilledRelayLog(
  logs: Array<{
    topics: string[];
    data: string;
  }>
): FillLog | undefined {
  const spokePoolIface = SpokePool__factory.createInterface();
  const parsedLogs = logs.flatMap((log) => {
    try {
      return spokePoolIface.parseLog(log);
    } catch (e) {
      return [];
    }
  });
  return parsedLogs.find(({ name }) =>
    [
      "FilledV3Relay", // NOTE: kept for backwards compatibility
      "FilledRelay", // NOTE: this is the new name for the event
    ].includes(name)
  ) as unknown as FillLog;
}

export async function getDepositByTxHash(
  depositTxHash: string,
  fromChainId: number
) {
  const fromProvider = getProvider(fromChainId);
  const depositTxReceipt =
    await fromProvider.getTransactionReceipt(depositTxHash);
  if (!depositTxReceipt) {
    throw new Error(
      `Could not fetch tx receipt for ${depositTxHash} on chain ${fromChainId}`
    );
  }

  const block = await fromProvider.getBlock(depositTxReceipt.blockNumber);

  if (depositTxReceipt.status === 0) {
    return {
      depositTxReceipt,
      parsedDepositLog: undefined,
      depositTimestamp: block.timestamp,
    };
  }

  const parsedDepositLog = parseFundsDepositedLog(depositTxReceipt.logs);
  if (!parsedDepositLog) {
    throw new NoFundsDepositedLogError(depositTxHash, fromChainId);
  }

  return {
    depositTxReceipt,
    parsedDepositLog,
    depositTimestamp: block.timestamp,
  };
}

// deposit status "reverted", "success", "failed"
// deposit timestamp

export type DepositStatus = "depositing" | "deposit-reverted" | "deposited";

export async function getDepositStatus(
  ...params: Parameters<typeof getDepositByTxHash>
): Promise<{ timestamp: number; status: DepositStatus }> {
  const deposit = await getDepositByTxHash(...params);
  return {
    timestamp: deposit.depositTimestamp,
    status: !deposit.depositTimestamp
      ? "depositing"
      : deposit?.depositTxReceipt.status === 0
        ? "deposit-reverted"
        : "deposited",
  };
}

export async function getFillByDepositTxHash(
  depositTxHash: string,
  fromChainId: number,
  toChainId: number,
  depositByTxHash: Awaited<ReturnType<typeof getDepositByTxHash>>
) {
  if (!depositByTxHash || !depositByTxHash.parsedDepositLog) {
    throw new Error(
      `Could not fetch deposit by tx hash ${depositTxHash} on chain ${fromChainId}`
    );
  }

  const { parsedDepositLog } = depositByTxHash;
  const depositId = parsedDepositLog.args.depositId;
  const provider = getProvider(toChainId);

  try {
    const { data } = await axios.get<{
      status: "filled" | "pending";
      fillTx: string | null;
    }>(`${rewardsApiUrl}/deposit/status`, {
      params: {
        depositId: depositId.toString(),
        originChainId: fromChainId,
      },
    });

    if (data?.status === "filled" && data.fillTx) {
      const fillTxReceipt = await provider.getTransactionReceipt(data.fillTx);
      const fillTxBlock = await provider.getBlock(fillTxReceipt.blockNumber);
      return {
        fillTxHashes: [data.fillTx],
        fillTxTimestamp: fillTxBlock.timestamp,
        depositByTxHash,
      };
    }
  } catch (e) {
    // If the deposit is not found, we can assume it is not indexed yet.
    // We continue to look for the filled relay event via RPC.
  }

  const blockForTimestamp = await getBlockForTimestamp(
    provider,
    depositByTxHash.depositTimestamp
  );
  const destinationSpokePool = config.getSpokePool(toChainId);
  const [legacyFilledRelayEvents, newFilledRelayEvents] = await Promise.all([
    destinationSpokePool.queryFilter(
      destinationSpokePool.filters.FilledV3Relay(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        fromChainId,
        depositId
      ),
      blockForTimestamp
    ),
    destinationSpokePool.queryFilter(
      destinationSpokePool.filters.FilledRelay(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        fromChainId,
        depositId
      ),
      blockForTimestamp
    ),
  ]);
  const filledRelayEvents = [
    ...legacyFilledRelayEvents,
    ...newFilledRelayEvents,
  ];
  // If we make it to this point, we can be sure that there is exactly one filled relay event
  // that corresponds to the deposit we are looking for.
  // The (depositId, fromChainId) tuple is unique for V3 filled relay events.
  const filledRelayEvent = filledRelayEvents[0];
  if (!isDefined(filledRelayEvent)) {
    throw new NoFilledRelayLogError(Number(depositId), toChainId);
  }
  const fillTxBlock = await filledRelayEvent.getBlock();
  return {
    fillTxHashes: filledRelayEvents.map((event) => event.transactionHash),
    fillTxTimestamp: fillTxBlock.timestamp,
    depositByTxHash,
  };
}

/**
 * Fetches deposit information from a Solana transaction signature
 * @param txSignature Solana transaction signature
 * @param chainId Solana chain ID
 * @returns Deposit information matching the interface expected by useDepositTracking
 */
export async function getDepositBySolTxSignature(
  txSignature: string,
  fromChainId: number
) {
  try {
    // Get Solana provider/connection
    const solanaProvider = getSVMProvider(fromChainId);

    // Get transaction details
    const txDetails = await solanaProvider.getTransaction(txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!txDetails) {
      throw new Error(
        `Could not fetch tx details for ${txSignature} on Solana chain ${fromChainId}`
      );
    }

    // Check transaction success
    const successful = txDetails.meta?.err === null;

    // Get the timestamp
    const blockTime = txDetails.blockTime ? txDetails.blockTime : 0;

    if (!successful) {
      // Return data in a format compatible with EVM deposits for the hook to consume
      return {
        depositTxReceipt: {
          status: 0,
          // Add minimal properties needed
          transactionHash: txSignature,
        },
        parsedDepositLog: undefined,
        depositTimestamp: blockTime,
        // Extra fields for SVM
        transactionSignature: txSignature,
      };
    }

    // Parse deposit information from transaction
    const parsedDepositData = parseSolanaDepositData(txDetails, fromChainId);

    if (!parsedDepositData) {
      throw new NoFundsDepositedLogError(txSignature, fromChainId);
    }

    // Return data in a format compatible with EVM deposits for the hook to consume
    return {
      depositTxReceipt: {
        status: 1,
        // Add minimal properties needed
        transactionHash: txSignature,
      },
      parsedDepositLog: {
        name: "FundsDeposited",
        args: parsedDepositData.args || {
          depositor: parsedDepositData.depositor,
        },
      },
      depositTimestamp: blockTime,
      // Extra fields for SVM
      transactionSignature: txSignature,
      depositor: parsedDepositData.depositor,
    };
  } catch (error) {
    console.error("Error fetching Solana deposit:", error);
    throw error;
  }
}

function parseSolanaDepositData(txDetails: any, chainId: number) {
  // This implementation will depend on the structure of the Solana program
  // and how deposit instructions are encoded

  try {
    // Find the program instruction that corresponds to a deposit
    // Assuming the program ID is stored in config
    const solanaProgram = getSVMProvider(chainId);

    // Get program instructions from the transaction
    const instructions = txDetails.transaction.message.instructions;

    // Find the instruction that calls the deposit method on the Solana program
    const depositInstruction = instructions.find(
      (ix: any) => ix.programId.toString() === solanaProgram
    );

    if (!depositInstruction) {
      return undefined;
    }

    // Decode the instruction data to extract deposit information
    // This will be program-specific
    const decoded = decodeSolanaDepositInstruction(depositInstruction.data);

    // Get the depositor account (typically the transaction signer)
    const depositor = txDetails.transaction.message.accountKeys[0].toString();

    return {
      ...decoded,
      depositor,
      args: {
        ...decoded,
        depositor,
      },
    };
  } catch (error) {
    console.error("Error parsing Solana deposit data:", error);
    return undefined;
  }
}

function decodeSolanaDepositInstruction(data: string) {
  // Implement instruction data decoding based on your program's schema
  // This is a placeholder implementation

  // The actual implementation will depend on how your Solana program
  // structures its deposit instruction data

  // Example: First byte might be instruction discriminator
  const buffer = Buffer.from(data, "base64");

  // Assuming instruction discriminator for deposit is 0
  if (buffer[0] !== 0) {
    return undefined;
  }

  // Parse remaining data according to program's schema
  // This is just an example and should be replaced with actual parsing
  return {
    depositId: buffer.readUInt32LE(1),
    amount: buffer.readBigUInt64LE(5).toString(),
    // Add other relevant fields based on your program's instruction format
  };
}

/**
 * Fetches fill information for a Solana deposit transaction
 * @param depositTxSignature Solana deposit transaction signature
 * @param fromChainId Origin chain ID
 * @param toChainId Destination chain ID
 * @param depositData Deposit data from getDepositBySolTxSignature
 * @returns Fill information matching the interface expected by useDepositTracking
 */
export async function getFillBySolDepositTxSignature(
  depositTxSignature: string,
  fromChainId: number,
  toChainId: number,
  depositData: any
) {
  // If deposit data is missing, throw an error
  if (!depositData || !depositData.parsedDepositLog) {
    throw new Error(
      `Could not fetch deposit by tx signature ${depositTxSignature} on chain ${fromChainId}`
    );
  }

  const { parsedDepositLog } = depositData;
  const depositId = parsedDepositLog.args.depositId;

  try {
    // First, try to get fill information from the API
    const { data } = await axios.get<{
      status: "filled" | "pending";
      fillTx: string | null;
    }>(`${rewardsApiUrl}/deposit/status`, {
      params: {
        depositId: depositId.toString(),
        originChainId: fromChainId,
      },
    });

    if (data?.status === "filled" && data.fillTx) {
      // For Solana destination
      if (
        toChainId === 1399811149 ||
        toChainId === 1399811150 ||
        toChainId === 1399811151
      ) {
        const solanaProvider = getSVMProvider(toChainId);

        // Get fill transaction details from Solana
        const fillTxDetails = await solanaProvider.getTransaction(data.fillTx, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });

        if (!fillTxDetails) {
          throw new Error(
            `Could not fetch fill tx details for ${data.fillTx} on Solana chain ${toChainId}`
          );
        }

        return {
          fillTxHashes: [data.fillTx],
          fillTxTimestamp: fillTxDetails.blockTime || 0,
          depositByTxHash: depositData, // Match the interface expected by useDepositTracking
        };
      } else {
        // For EVM destination
        const provider = getProvider(toChainId);
        const fillTxReceipt = await provider.getTransactionReceipt(data.fillTx);
        const fillTxBlock = await provider.getBlock(fillTxReceipt.blockNumber);

        return {
          fillTxHashes: [data.fillTx],
          fillTxTimestamp: fillTxBlock.timestamp,
          depositByTxHash: depositData, // Match the interface expected by useDepositTracking
        };
      }
    }
  } catch (e) {
    // If the deposit is not found, we can assume it is not indexed yet.
    // We continue to look for the filled relay event manually.
    console.warn(`Error getting fill status from API: ${e}`);
  }

  // If we couldn't get fill info from the API, try to find it manually
  // This part will depend on how fills are tracked for the specific chains
  if (
    toChainId === 1399811149 ||
    toChainId === 1399811150 ||
    toChainId === 1399811151
  ) {
    // For Solana destination, we need to query the Solana program
    const fillData = await getSolanaFillByDepositId(
      depositId,
      fromChainId,
      toChainId,
      depositData
    );

    return {
      fillTxHashes: fillData.fillTxHashes,
      fillTxTimestamp: fillData.fillTxTimestamp,
      depositByTxHash: depositData, // Match the interface expected by useDepositTracking
    };
  } else {
    // For EVM destination, we can use the existing logic but with some modifications
    const provider = getProvider(toChainId);
    const blockForTimestamp = await getBlockForTimestamp(
      provider,
      depositData.depositTimestamp
    );

    const destinationSpokePool = config.getSpokePool(toChainId);
    const [legacyFilledRelayEvents, newFilledRelayEvents] = await Promise.all([
      destinationSpokePool.queryFilter(
        destinationSpokePool.filters.FilledV3Relay(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          fromChainId,
          depositId
        ),
        blockForTimestamp
      ),
      destinationSpokePool.queryFilter(
        destinationSpokePool.filters.FilledRelay(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          fromChainId,
          depositId
        ),
        blockForTimestamp
      ),
    ]);

    const filledRelayEvents = [
      ...legacyFilledRelayEvents,
      ...newFilledRelayEvents,
    ];

    const filledRelayEvent = filledRelayEvents[0];
    if (!isDefined(filledRelayEvent)) {
      throw new NoFilledRelayLogError(depositId, toChainId);
    }

    const fillTxBlock = await filledRelayEvent.getBlock();
    return {
      fillTxHashes: filledRelayEvents.map((event) => event.transactionHash),
      fillTxTimestamp: fillTxBlock.timestamp,
      depositByTxHash: depositData, // Match the interface expected by useDepositTracking
    };
  }
}

/**
 * Helper function to find fill information on Solana
 * @param depositId Deposit ID
 * @param fromChainId Origin chain ID
 * @param toChainId Destination chain ID (Solana)
 * @param depositData Deposit data
 * @returns Fill information
 */
async function getSolanaFillByDepositId(
  depositId: number,
  fromChainId: number,
  toChainId: number,
  depositData: any
) {
  const solanaProvider = getSVMProvider(toChainId);
  const solanaProgram = config.getSpokePoolProgramId(toChainId);

  // We need to scan for program account data that matches our deposit ID
  // This implementation will depend on how fills are stored in the Solana program

  // Example approach: Query program accounts with a filter
  const accounts = await solanaProvider.getProgramAccounts(solanaProgram, {
    filters: [
      {
        // Find accounts containing deposit ID and from chain ID
        // This is just an example - actual implementation depends on program structure
        memcmp: {
          offset: 0, // Offset in data where deposit ID starts
          bytes: Buffer.from([depositId, fromChainId].toString()).toString(
            "base64"
          ),
        },
      },
    ],
  });

  if (accounts.length === 0) {
    throw new Error(
      `No fill found for deposit ID ${depositId} from chain ${fromChainId}`
    );
  }

  // Parse the account data to find the fill transaction
  // Again, this will depend on program-specific data structure
  const fillAccount = accounts[0];

  // For demonstration, using a placeholder implementation
  // In reality, you'd extract this from the account data
  const fillTxSignature = "placeholder_signature";

  // Get transaction details
  const fillTxDetails = await solanaProvider.getTransaction(fillTxSignature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  if (!fillTxDetails) {
    throw new Error(`Could not fetch fill tx details for ${fillTxSignature}`);
  }

  return {
    fillTxHashes: [fillTxSignature],
    fillTxTimestamp: fillTxDetails.blockTime || 0,
    depositData,
  };
}
