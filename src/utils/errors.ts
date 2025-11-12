import axios, { AxiosError } from "axios";
import { ChainId } from "./constants";

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
