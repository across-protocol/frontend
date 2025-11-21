import axios, { AxiosError } from "axios";
import { ChainId } from "./constants";
import { ethers } from "ethers";
import { SpokePoolErrorAbi } from "./abis/spokepool-errors";
import { getProvider } from "./providers";
import { chainIsEvm } from "./sdk";

export class UnsupportedChainIdError extends Error {
  public constructor(unsupportedChainId: number) {
    super();
    this.name = this.constructor.name;
    this.message = `Unsupported chain id: ${unsupportedChainId}. Supported chains are: ${[
      ...Object.values(ChainId),
    ]}.`;
  }
}

export class WrongNetworkError extends Error {
  correctChainId: ChainId;
  public constructor(correctChainId: ChainId) {
    super();
    this.name = this.constructor.name;
    this.message = `Connected to the wrong network.`;
    this.correctChainId = correctChainId;
  }
}

export class ParsingError extends Error {
  public constructor() {
    super();
    this.name = this.constructor.name;
    this.message = "Invalid number.";
  }
}

export class TransactionError extends Error {
  public constructor(address: string, method?: string, ...txArgs: unknown[]) {
    super();
    this.name = this.constructor.name;
    this.message = `Transaction to ${address} calling ${method} reverted with args: [${txArgs}]`;
  }
}

export class FeeTooHighError extends Error {
  public constructor() {
    super();
    this.name = this.constructor.name;
    this.message = "Fees are too high.";
  }
}
export class InsufficientLiquidityError extends Error {
  public constructor(token: string) {
    super();
    this.name = this.constructor.name;
    this.message = `Insufficient liquidity for ${token}.`;
  }
}

export class InsufficientBalanceError extends Error {
  constructor() {
    super();
    this.name = this.constructor.name;
    this.message = "Insufficient balance.";
  }
}

export type AcrossApiErrorResponse = {
  code?: string;
  message?: string;
};

export function getQuoteWarningMessage(error: Error | null): string | null {
  if (!error || !axios.isAxiosError(error)) {
    return null;
  }

  const axiosError = error as AxiosError<AcrossApiErrorResponse>;

  const errorData = axiosError.response?.data;
  if (!errorData?.code) {
    return null;
  }

  const code = errorData.code;
  const message = errorData.message;

  // Upstream swap provider errors - show user-friendly messages
  switch (code) {
    case "SWAP_LIQUIDITY_INSUFFICIENT":
      return "Insufficient liquidity available for this swap. Try a smaller amount or different tokens.";

    case "SWAP_QUOTE_UNAVAILABLE":
      return message?.includes("No possible route")
        ? "No route found for this token pair. Try selecting different tokens."
        : "Unable to get a quote at this time. Please try again.";

    case "SWAP_TYPE_NOT_GUARANTEED":
      return "This trade type cannot be guaranteed on this route. Try a different amount or token pair.";

    case "AMOUNT_TOO_LOW":
      return "Amount is too low to cover bridge and swap fees. Try increasing the amount.";

    case "AMOUNT_TOO_HIGH":
      return "Amount exceeds the maximum deposit limit. Try a smaller amount.";

    case "ROUTE_NOT_ENABLED":
      return "This route is currently unavailable. Try different chains or tokens.";

    case "INVALID_PARAM":
      // return "Invalid parameters. Please check your input and try again.";
      if (!message) {
        return "Unable to get a quote at this time. Please try again.";
      }
      if (
        message?.includes("doesn't have enough funds to support this deposit")
      ) {
        return "Amount too high. Try a smaller amount.";
      }
      return message;

    // Upstream service errors - be more generic
    case "UPSTREAM_HTTP_ERROR":
    case "UPSTREAM_RPC_ERROR":
    case "UPSTREAM_GATEWAY_TIMEOUT":
    case "UNEXPECTED_ERROR":
    case "SIMULATION_ERROR":
    case "ABI_ENCODING_ERROR":
    case "INVALID_METHOD":
    case "MISSING_PARAM":
    default:
      return "Oops, something went wrong. Please try again.";
  }
}

export type EthersCallRevertError = Error & {
  code?: string;
  reason?: string;
  data?: string;

  error?: {
    code?: string;
    reason?: string;
    data?: string;
    error?: {
      data?: string;
    };
  };

  body?: string; // JSON string with error.data
};

export function decodeSpokepoolError(data: string) {
  if (!data || data === "0x") {
    return "Transaction reverted (no revert data)";
  }

  try {
    const spokepoolInterface = new ethers.utils.Interface(SpokePoolErrorAbi);
    const parsed = spokepoolInterface.parseError(data);
    if (!parsed) {
      throw new Error("unable to parse custom errors");
    }
    return parsed.name; // eg. InvalidQuoteTimestamp or InvalidRelayerFeePct etc
  } catch {
    // fallback
    return `Transaction reverted (raw data: ${data})`;
  }
}

export const SPOKEPOOL_REVERT_REASON_MESSAGES: Record<string, string> = {
  default: "Transaction reverted.",
  InvalidQuoteTimestamp:
    "Quote expired - please try again to get updated rates.",
  // ...
};

export type SpokepoolRevertReason = {
  error: string;
  formattedError: string;
};

/**
 * Formats a decoded error name into a user-friendly message
 */
function formatSpokepoolError(errorName: string): string {
  return (
    SPOKEPOOL_REVERT_REASON_MESSAGES[errorName] ||
    SPOKEPOOL_REVERT_REASON_MESSAGES.default
  );
}

// Re-simulate tx to capture revert data
export async function getRevertDataFromReceipt(
  receipt: ethers.providers.TransactionReceipt,
  chainId: number
): Promise<string | null> {
  if (receipt.status !== 0) {
    // Not a failed tx
    return null;
  }

  try {
    const provider = getProvider(chainId);

    const tx = await provider.getTransaction(receipt.transactionHash);

    if (!tx) {
      throw new Error("Could not load transaction for receipt");
    }

    // re-simulate
    const res = await provider.call(
      {
        to: tx.to!,
        from: tx.from,
        data: tx.data,
        value: tx.value,
      },
      receipt.blockNumber
    );
    if (!res) {
      return null;
    }

    return res; // revert payload
  } catch (err: unknown) {
    const revertData = extractRevertData(err);

    if (!revertData) {
      return null;
    }

    return revertData; // revert payload
  }
}

function extractRevertData(err: unknown): string | undefined {
  const e = err as EthersCallRevertError;

  // Most common cases:
  if (e.data && e.data !== "0x") return e.data;
  if (e.error?.data && e.error.data !== "0x") return e.error.data;
  if (e.error?.error?.data && e.error.error.data !== "0x")
    return e.error.error.data;

  // Some RPCs embed revert data inside err.body JSON:
  if (e.body) {
    try {
      const parsed = JSON.parse(e.body);
      const data = parsed?.error?.data;
      if (typeof data === "string" && data !== "0x") return data;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

/**
 * Decodes and formats a SpokePool transaction revert reason
 * @param receipt The transaction receipt (must have status 0 for failed tx)
 * @param chainId The chain ID where the transaction was executed
 * @returns Object containing the raw error name and formatted user-friendly message, or null if unable to decode
 */
export async function getSpokepoolRevertReason(
  receipt: ethers.providers.TransactionReceipt,
  chainId: number
): Promise<SpokepoolRevertReason | null> {
  if (!chainIsEvm(chainId)) {
    console.warn("Cannot decode revert message on SVM chains");
    return null;
  }

  if (receipt.status !== 0) {
    // Not a failed transaction
    return null;
  }

  try {
    const revertData = await getRevertDataFromReceipt(receipt, chainId);
    if (!revertData) {
      return null;
    }

    const errorName = decodeSpokepoolError(revertData);
    const formattedError = formatSpokepoolError(errorName);

    return {
      error: errorName,
      formattedError,
    };
  } catch (error) {
    console.error("Failed to decode SpokePool revert reason:", error);
    return null;
  }
}
