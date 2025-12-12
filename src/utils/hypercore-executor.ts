import { BigNumber, ethers } from "ethers";
import { ConvertDecimals } from "./convertdecimals";

/**
 * ABI for HyperCoreFlowExecutor events
 */
const HYPERCORE_FLOW_EXECUTOR_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "quoteNonce",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "finalRecipient",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "finalToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "evmAmountIn",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "bridgingFeesIncurred",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "evmAmountSponsored",
        type: "uint256",
      },
    ],
    name: "SimpleTransferFlowCompleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "quoteNonce",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "finalRecipient",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "finalToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "evmAmountIn",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "bridgingFeesIncurred",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "evmAmountSponsored",
        type: "uint256",
      },
    ],
    name: "FallbackHyperEVMFlowCompleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "quoteNonce",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "finalRecipient",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "finalToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint64",
        name: "totalSent",
        type: "uint64",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "evmAmountSponsored",
        type: "uint256",
      },
    ],
    name: "SwapFlowFinalized",
    type: "event",
  },
];

export type SimpleTransferFlowCompletedEvent = {
  quoteNonce: string;
  finalRecipient: string;
  finalToken: string;
  evmAmountIn: BigNumber;
  bridgingFeesIncurred: BigNumber;
  evmAmountSponsored: BigNumber;
};

export type FallbackHyperEVMFlowCompletedEvent = {
  quoteNonce: string;
  finalRecipient: string;
  finalToken: string;
  evmAmountIn: BigNumber;
  bridgingFeesIncurred: BigNumber;
  evmAmountSponsored: BigNumber;
};

export type SwapFlowFinalizedEvent = {
  quoteNonce: string;
  finalRecipient: string;
  finalToken: string;
  totalSent: BigNumber;
  evmAmountSponsored: BigNumber;
};

/**
 * Parses logs for SimpleTransferFlowCompleted events from HyperCoreFlowExecutor
 * @param logs - Transaction logs to parse
 * @returns Parsed SimpleTransferFlowCompleted event or undefined if not found
 */
export function parseSimpleTransferFlowCompletedLog(
  logs: ethers.providers.Log[]
): SimpleTransferFlowCompletedEvent | undefined {
  const iface = new ethers.utils.Interface(HYPERCORE_FLOW_EXECUTOR_ABI);
  const parsedLogs = logs.flatMap((log) => {
    try {
      return iface.parseLog(log);
    } catch {
      return [];
    }
  });

  const simpleTransferLog = parsedLogs.find(
    ({ name }) => name === "SimpleTransferFlowCompleted"
  );

  if (!simpleTransferLog) {
    return undefined;
  }

  return {
    quoteNonce: simpleTransferLog.args.quoteNonce,
    finalRecipient: simpleTransferLog.args.finalRecipient,
    finalToken: simpleTransferLog.args.finalToken,
    evmAmountIn: BigNumber.from(simpleTransferLog.args.evmAmountIn),
    bridgingFeesIncurred: BigNumber.from(
      simpleTransferLog.args.bridgingFeesIncurred
    ),
    evmAmountSponsored: BigNumber.from(
      simpleTransferLog.args.evmAmountSponsored
    ),
  };
}

/**
 * Parses logs for FallbackHyperEVMFlowCompleted events from HyperCoreFlowExecutor
 * @param logs - Transaction logs to parse
 * @returns Parsed FallbackHyperEVMFlowCompleted event or undefined if not found
 */
export function parseFallbackHyperEVMFlowCompletedLog(
  logs: ethers.providers.Log[]
): FallbackHyperEVMFlowCompletedEvent | undefined {
  const iface = new ethers.utils.Interface(HYPERCORE_FLOW_EXECUTOR_ABI);
  const parsedLogs = logs.flatMap((log) => {
    try {
      return iface.parseLog(log);
    } catch {
      return [];
    }
  });

  const fallbackLog = parsedLogs.find(
    ({ name }) => name === "FallbackHyperEVMFlowCompleted"
  );

  if (!fallbackLog) {
    return undefined;
  }

  return {
    quoteNonce: fallbackLog.args.quoteNonce,
    finalRecipient: fallbackLog.args.finalRecipient,
    finalToken: fallbackLog.args.finalToken,
    evmAmountIn: BigNumber.from(fallbackLog.args.evmAmountIn),
    bridgingFeesIncurred: BigNumber.from(fallbackLog.args.bridgingFeesIncurred),
    evmAmountSponsored: BigNumber.from(fallbackLog.args.evmAmountSponsored),
  };
}

/**
 * Parses logs for SwapFlowFinalized events from HyperCoreFlowExecutor
 * @param logs - Transaction logs to parse
 * @returns Parsed SwapFlowFinalized event or undefined if not found
 */
export function parseSwapFlowFinalizedLog(
  logs: ethers.providers.Log[]
): SwapFlowFinalizedEvent | undefined {
  const iface = new ethers.utils.Interface(HYPERCORE_FLOW_EXECUTOR_ABI);
  const parsedLogs = logs.flatMap((log) => {
    try {
      return iface.parseLog(log);
    } catch {
      return [];
    }
  });

  const swapFinalizedLog = parsedLogs.find(
    ({ name }) => name === "SwapFlowFinalized"
  );

  if (!swapFinalizedLog) {
    return undefined;
  }

  return {
    quoteNonce: swapFinalizedLog.args.quoteNonce,
    finalRecipient: swapFinalizedLog.args.finalRecipient,
    finalToken: swapFinalizedLog.args.finalToken,
    totalSent: BigNumber.from(swapFinalizedLog.args.totalSent),
    evmAmountSponsored: BigNumber.from(
      swapFinalizedLog.args.evmAmountSponsored
    ),
  };
}

/**
 * Parses logs for any HyperCoreFlowExecutor completion event
 * (SimpleTransferFlowCompleted, FallbackHyperEVMFlowCompleted, or SwapFlowFinalized)
 * and returns the output amount received by the user.
 *
 * @param logs - Transaction logs to parse
 * @returns The output amount (evmAmountIn + evmAmountSponsored - bridgingFeesIncurred for transfer/fallback flows,
 *          or totalSent for swap flows), or undefined if no matching event is found
 */
export function parseOutputAmountFromHyperCoreFlowLogs(
  logs: ethers.providers.Log[]
): BigNumber | undefined {
  // Try SimpleTransferFlowCompleted first
  const simpleTransferEvent = parseSimpleTransferFlowCompletedLog(logs);
  if (simpleTransferEvent) {
    return simpleTransferEvent.evmAmountIn.add(
      simpleTransferEvent.evmAmountSponsored
    );
  }

  // Try FallbackHyperEVMFlowCompleted
  const fallbackEvent = parseFallbackHyperEVMFlowCompletedLog(logs);
  if (fallbackEvent) {
    // Output = evmAmountIn + evmAmountSponsored - bridgingFeesIncurred
    return fallbackEvent.evmAmountIn.add(fallbackEvent.evmAmountSponsored);
  }

  // Try SwapFlowFinalized
  const swapFinalizedEvent = parseSwapFlowFinalizedLog(logs);
  if (swapFinalizedEvent) {
    // Output = totalSent (the amount sent to user on HyperCore)
    // Need to convert from 8 decimals to 6 decimals because `totalSent` is in HyperCore
    // decimals (8 decimals)
    return ConvertDecimals(8, 6)(swapFinalizedEvent.totalSent);
  }

  return undefined;
}
