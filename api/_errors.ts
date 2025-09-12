import type { VercelResponse } from "@vercel/node";
import { AxiosError } from "axios";
import { StructError } from "superstruct";
import { relayFeeCalculator, typeguards } from "@across-protocol/sdk";
import { ethers } from "ethers";
import { Span, SpanStatusCode } from "@opentelemetry/api";
import { ATTR_HTTP_RESPONSE_STATUS_CODE } from "@opentelemetry/semantic-conventions";

import { sendResponse } from "./_response_utils";

export type AcrossApiErrorCodeKey = keyof typeof AcrossErrorCode;
export type AcrossApiErrorCode =
  (typeof AcrossErrorCode)[AcrossApiErrorCodeKey];

type EthersErrorTransaction = {
  from: string;
  to: string;
  data: string;
  chainId?: number;
};

export const HttpErrorToStatusCode = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export const AcrossErrorCode = {
  // Status: 40X
  INVALID_PARAM: "INVALID_PARAM",
  INVALID_METHOD: "INVALID_METHOD",
  MISSING_PARAM: "MISSING_PARAM",
  SIMULATION_ERROR: "SIMULATION_ERROR",
  AMOUNT_TOO_LOW: "AMOUNT_TOO_LOW",
  AMOUNT_TOO_HIGH: "AMOUNT_TOO_HIGH",
  ROUTE_NOT_ENABLED: "ROUTE_NOT_ENABLED",
  SWAP_LIQUIDITY_INSUFFICIENT: "SWAP_LIQUIDITY_INSUFFICIENT",
  SWAP_QUOTE_UNAVAILABLE: "SWAP_QUOTE_UNAVAILABLE",
  SWAP_TYPE_NOT_GUARANTEED: "SWAP_TYPE_NOT_GUARANTEED",
  ABI_ENCODING_ERROR: "ABI_ENCODING_ERROR",

  // Status: 50X
  UPSTREAM_RPC_ERROR: "UPSTREAM_RPC_ERROR",
  UPSTREAM_HTTP_ERROR: "UPSTREAM_HTTP_ERROR",
  UPSTREAM_GATEWAY_TIMEOUT: "UPSTREAM_GATEWAY_TIMEOUT",
  UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
} as const;

export class AcrossApiError extends Error {
  code?: AcrossApiErrorCodeKey;
  status: number;
  message: string;
  param?: string;
  id?: string;

  constructor(
    args: {
      code?: AcrossApiErrorCodeKey;
      status: number;
      message: string;
      param?: string;
    },
    opts?: ErrorOptions
  ) {
    super(args.message, opts);
    this.code = args.code;
    this.status = args.status;
    this.message = args.message;
    this.param = args.param;
  }

  toJSON() {
    return {
      type: "AcrossApiError",
      code: this.code,
      status: this.status,
      message: this.message,
      param: this.param,
      id: this.id,
    };
  }
}

export class TokenNotFoundError extends AcrossApiError {
  constructor(args: { address: string; chainId: number; opts?: ErrorOptions }) {
    super(
      {
        message: `Unable to find tokenDetails for address: ${args.address}, on chain with id: ${args.chainId}`,
        status: HttpErrorToStatusCode.NOT_FOUND,
      },
      args.opts
    );
  }
}

export class UnauthorizedError extends AcrossApiError {
  constructor(args?: { message: string }, opts?: ErrorOptions) {
    super(
      {
        message: args?.message ?? "Unauthorized",
        status: HttpErrorToStatusCode.UNAUTHORIZED,
      },
      opts
    );
  }
}

export class InputError extends AcrossApiError {
  constructor(
    args: {
      message: string;
      code: AcrossApiErrorCodeKey;
      param?: string;
    },
    opts?: ErrorOptions
  ) {
    super(
      {
        ...args,
        status: HttpErrorToStatusCode.BAD_REQUEST,
      },
      opts
    );
  }
}

export class InvalidParamError extends InputError {
  constructor(args: { message: string; param?: string }) {
    super({
      message: args.message,
      code: AcrossErrorCode.INVALID_PARAM,
      param: args.param,
    });
  }
}

export class MissingParamError extends InputError {
  constructor(args: { message: string; param?: string }) {
    super({
      message: args.message,
      code: AcrossErrorCode.MISSING_PARAM,
      param: args.param,
    });
  }
}

export class AbiEncodingError extends InputError {
  constructor(args: { message: string }, opts?: ErrorOptions) {
    super(
      {
        message: args.message,
        code: AcrossErrorCode.ABI_ENCODING_ERROR,
      },
      opts
    );
  }
}

export class SimulationError extends InputError {
  public transaction: EthersErrorTransaction;

  constructor(
    args: {
      message: string;
      transaction: EthersErrorTransaction;
    },
    opts?: ErrorOptions
  ) {
    super(
      {
        message: args.message,
        code: AcrossErrorCode.SIMULATION_ERROR,
      },
      opts
    );
    this.transaction = args.transaction;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      transaction: this.transaction,
    };
  }
}

export class RouteNotEnabledError extends InputError {
  constructor(args: { message: string }, opts?: ErrorOptions) {
    super(
      {
        message: args.message,
        code: AcrossErrorCode.ROUTE_NOT_ENABLED,
      },
      opts
    );
  }
}

export class AmountTooLowError extends InputError {
  constructor(args: { message: string }, opts?: ErrorOptions) {
    super(
      {
        message: args.message,
        code: AcrossErrorCode.AMOUNT_TOO_LOW,
      },
      opts
    );
  }
}

export class SwapAmountTooLowForBridgeFeesError extends InputError {
  constructor(
    args: { bridgeAmount: string; bridgeFee: string },
    opts?: ErrorOptions
  ) {
    super(
      {
        message: `Failed to fetch swap quote: Bridge amount ${
          args.bridgeAmount
        } is too low to cover bridge fees ${args.bridgeFee}`,
        code: AcrossErrorCode.AMOUNT_TOO_LOW,
      },
      opts
    );
  }
}

export class AmountTooHighError extends InputError {
  constructor(args: { message: string }, opts?: ErrorOptions) {
    super(
      {
        message: args.message,
        code: AcrossErrorCode.AMOUNT_TOO_HIGH,
      },
      opts
    );
  }
}

export class SwapQuoteUnavailableError extends AcrossApiError {
  constructor(
    args: {
      message: string;
      code: AcrossApiErrorCode;
    },
    opts?: ErrorOptions
  ) {
    super(
      {
        message: args.message,
        code: args.code,
        status:
          args.code === AcrossErrorCode.UPSTREAM_HTTP_ERROR ||
          args.code === AcrossErrorCode.UPSTREAM_RPC_ERROR
            ? HttpErrorToStatusCode.BAD_GATEWAY
            : HttpErrorToStatusCode.BAD_REQUEST,
      },
      opts
    );
  }
}

export class UpstreamTimeoutError extends AcrossApiError {
  constructor(args: { message: string }, opts?: ErrorOptions) {
    super(
      {
        message: args.message,
        code: AcrossErrorCode.UPSTREAM_GATEWAY_TIMEOUT,
        status: HttpErrorToStatusCode.GATEWAY_TIMEOUT,
      },
      opts
    );
  }
}

export class UpstreamHttpError extends AcrossApiError {
  constructor(args: { message: string }, opts?: ErrorOptions) {
    super(
      {
        message: args.message,
        code: AcrossErrorCode.UPSTREAM_HTTP_ERROR,
        status: HttpErrorToStatusCode.BAD_GATEWAY,
      },
      opts
    );
  }
}

export class UpstreamRpcError extends AcrossApiError {
  constructor(args: { message: string }, opts?: ErrorOptions) {
    super(
      {
        message: args.message,
        code: AcrossErrorCode.UPSTREAM_RPC_ERROR,
        status: HttpErrorToStatusCode.BAD_GATEWAY,
      },
      opts
    );
  }
}

export class UnexpectedError extends AcrossApiError {
  constructor(args: { message?: string }, opts?: ErrorOptions) {
    super(
      {
        message:
          args.message ??
          "Unexpected error occurred. Please try again later or contact support.",
        code: AcrossErrorCode.UNEXPECTED_ERROR,
        status: HttpErrorToStatusCode.INTERNAL_SERVER_ERROR,
      },
      opts
    );
  }
}

export const UPSTREAM_SWAP_PROVIDER_ERRORS = {
  INSUFFICIENT_LIQUIDITY: "INSUFFICIENT_LIQUIDITY",
  NO_POSSIBLE_ROUTE: "NO_POSSIBLE_ROUTE",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  SELL_ENTIRE_BALANCE_UNSUPPORTED: "SELL_ENTIRE_BALANCE_UNSUPPORTED",
  SLIPPAGE_TOLERANCE_EXCEEDED: "SLIPPAGE_TOLERANCE_EXCEEDED",
  TRANSACTION_BUILD_FAILED: "TRANSACTION_BUILD_FAILED",
  UNSUPPORTED_OPERATION: "UNSUPPORTED_OPERATION",
} as const;
export type UpstreamSwapProviderErrorCode =
  (typeof UPSTREAM_SWAP_PROVIDER_ERRORS)[keyof typeof UPSTREAM_SWAP_PROVIDER_ERRORS];

export class UpstreamSwapProviderError extends Error {
  code: UpstreamSwapProviderErrorCode;
  swapProvider: string;

  constructor(
    args: {
      message: string;
      code: UpstreamSwapProviderErrorCode;
      swapProvider: string;
    },
    opts?: ErrorOptions
  ) {
    super(args.message, opts);
    this.code = args.code;
    this.swapProvider = args.swapProvider;
  }
}

/**
 * Handles the recurring case of error handling
 * @param endpoint A string numeric to indicate to the logging utility where this error occurs
 * @param response A VercelResponse object that is used to interract with the returning reponse
 * @param logger A logging utility to write to a cloud logging provider
 * @param error The error that will be returned to the user
 * @param span The span to record the error on
 * @param requestId The request ID to set in the response body
 * @returns The `response` input with a status/send sent. Note: using this object again will cause an exception
 */
export function handleErrorCondition(
  endpoint: string,
  response: VercelResponse,
  logger: relayFeeCalculator.Logger,
  error: unknown,
  span?: Span,
  requestId?: string
): VercelResponse {
  let acrossApiError: AcrossApiError;

  // Handle superstruct validation errors
  if (error instanceof StructError) {
    const { type, path } = error;
    // Sanitize the error message that will be sent to client
    const message = `Invalid parameter at path '${path}'. Expected type '${type}'`;
    acrossApiError = new InputError(
      {
        message,
        code: AcrossErrorCode.INVALID_PARAM,
        param: path.join("."),
      },
      { cause: error }
    );
  }
  // Handle axios errors
  else if (error instanceof AxiosError) {
    const { response } = error;
    const compactError = compactAxiosError(error);

    // If upstream error is an AcrossApiError, we just return it
    if (response?.data?.type === "AcrossApiError") {
      if (response.data.code === AcrossErrorCode.SIMULATION_ERROR) {
        acrossApiError = new SimulationError(
          {
            message: response.data.message,
            transaction: response.data.transaction,
          },
          { cause: compactError }
        );
      } else {
        acrossApiError = new AcrossApiError(
          {
            message: response.data.message,
            status: response.data.status,
            code: response.data.code,
            param: response.data.param,
          },
          { cause: compactError }
        );
      }
    } else {
      const message = `Upstream http request to ${error.request?.host} failed with ${error.response?.status}`;
      acrossApiError = new UpstreamHttpError(
        { message },
        { cause: compactError }
      );
    }
  }
  // Handle ethers errors
  else if (typeguards.isEthersError(error)) {
    acrossApiError = resolveEthersError(error);
  }
  // Rethrow instances of `AcrossApiError`
  else if (error instanceof AcrossApiError) {
    acrossApiError = error;
  }
  // Handle other errors
  else {
    acrossApiError = new UnexpectedError({}, { cause: error });
  }

  const logLevel = acrossApiError.status >= 500 ? "error" : "warn";
  logger[logLevel]({
    at: endpoint,
    code: acrossApiError.code,
    message: `Status ${acrossApiError.status} - ${acrossApiError.message}`,
    cause: acrossApiError.cause,
  });

  if (span) {
    span.recordException(acrossApiError);
    span.setAttribute(ATTR_HTTP_RESPONSE_STATUS_CODE, acrossApiError.status);

    let spanMessage = acrossApiError.message;
    if (acrossApiError.cause) {
      let causeMessage: string;

      if (Array.isArray(acrossApiError.cause)) {
        causeMessage = acrossApiError.cause
          .map((error) =>
            error instanceof Error ? error.message : String(error)
          )
          .join("; ");
      } else if (acrossApiError.cause instanceof Error) {
        causeMessage = acrossApiError.cause.message;
      } else {
        causeMessage = String(acrossApiError.cause);
      }

      spanMessage += ` | Cause: ${causeMessage}`;
    }

    span.setStatus({
      code:
        acrossApiError.status >= 500 ? SpanStatusCode.ERROR : SpanStatusCode.OK,
      message: spanMessage,
    });
  }

  return sendResponse({
    response,
    body: acrossApiError,
    statusCode: acrossApiError.status,
    requestId,
  });
}

export function resolveEthersError(err: unknown) {
  if (!typeguards.isEthersError(err)) {
    return new UpstreamRpcError(
      {
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { cause: err }
    );
  }

  const { reason, code } = err;
  const method = "method" in err ? (err.method as string) : undefined;
  const transaction =
    "transaction" in err
      ? (err.transaction as EthersErrorTransaction)
      : undefined;

  // Simulation errors
  if (
    transaction &&
    method === "estimateGas" &&
    (code === ethers.utils.Logger.errors.UNPREDICTABLE_GAS_LIMIT ||
      code === ethers.utils.Logger.errors.CALL_EXCEPTION)
  ) {
    const rpcErrorMessageMatch = reason
      .replace(/\\/g, "")
      .match(/"message":"((?:[^"\\]|\\.)*)"/);
    const rpcErrorMessage = rpcErrorMessageMatch
      ? rpcErrorMessageMatch[1]
      : reason;

    return new SimulationError(
      {
        message: rpcErrorMessage,
        transaction: transaction,
      },
      { cause: err }
    );
  }

  return new AcrossApiError(
    {
      message: `${err.reason}: ${err.code} - ${err.error}`,
      status: HttpErrorToStatusCode.INTERNAL_SERVER_ERROR,
      code: AcrossErrorCode.UPSTREAM_RPC_ERROR,
    },
    { cause: err }
  );
}

export function compactAxiosError(error: Error) {
  if (!(error instanceof AxiosError)) {
    return error;
  }

  const { response } = error;
  if (!response) {
    return error;
  }

  const compactError = new Error(
    [
      "[AxiosError]",
      `Status ${response.status} ${response.statusText}`,
      `Request URL: ${response.config.url}`,
      `Data: ${JSON.stringify(response.data)}`,
    ].join(" - ")
  );

  return compactError;
}

export function flattenErrors(reason: any, depth: number = 0): string[] {
  if (
    reason instanceof AggregateError &&
    Array.isArray(reason.errors) &&
    depth < 1
  ) {
    return reason.errors.flatMap((error) => flattenErrors(error, depth + 1));
  }
  const response = reason.response;
  if (reason.isAxiosError && response) {
    return [compactAxiosError(reason).toString()];
  }

  if (reason instanceof AcrossApiError) {
    return [`[AcrossApiError]: ${JSON.stringify(reason)}`];
  }

  return [reason.toString()];
}

export function getRejectedReasons(
  settledResultsOrErrors: PromiseSettledResult<any>[] | Error[]
): string[] {
  try {
    const rejections = settledResultsOrErrors.flatMap((result) => {
      if (result instanceof Error) {
        return result;
      }
      if (result.status === "rejected") {
        return result.reason;
      }
      return [];
    });
    return rejections.flatMap((reason, idx) =>
      flattenErrors(reason).map((msg) => `Quote ${idx + 1}: ${msg}`)
    );
  } catch (err) {
    return [];
  }
}

export function getSwapQuoteUnavailableError(errors: Error[]) {
  if (errors.length === 1 && errors[0] instanceof SwapQuoteUnavailableError) {
    return errors[0];
  }

  const upstreamSwapProviderErrors = errors.filter(
    (error) => error instanceof UpstreamSwapProviderError
  );
  const swapQuoteUnavailableErrors = errors.filter(
    (error) => error instanceof SwapQuoteUnavailableError
  );
  const otherAcrossApiErrors = errors.filter(
    (error) =>
      error instanceof AcrossApiError &&
      !(error instanceof SwapQuoteUnavailableError)
  );
  const axiosErrors = errors.filter((error) => error instanceof AxiosError);
  const upstreamAcrossApiErrors = axiosErrors.filter(
    (error) => error.response?.data?.type === "AcrossApiError"
  );

  // Map upstream swap provider errors to AcrossApiErrors
  const upstreamErrorToAcrossApiError = {
    [UPSTREAM_SWAP_PROVIDER_ERRORS.INSUFFICIENT_LIQUIDITY]: {
      message: "Insufficient liquidity",
      code: AcrossErrorCode.SWAP_LIQUIDITY_INSUFFICIENT,
    },
    [UPSTREAM_SWAP_PROVIDER_ERRORS.NO_POSSIBLE_ROUTE]: {
      message: "No possible route",
      code: AcrossErrorCode.SWAP_QUOTE_UNAVAILABLE,
    },
    [UPSTREAM_SWAP_PROVIDER_ERRORS.SELL_ENTIRE_BALANCE_UNSUPPORTED]: {
      message: [
        "Trade type can not be guaranteed with the available swap providers on this route.",
        "Please try again with a different trade type or set 'strictTradeType=false' in the query params.",
      ].join(" "),
      code: AcrossErrorCode.SWAP_TYPE_NOT_GUARANTEED,
    },
    [UPSTREAM_SWAP_PROVIDER_ERRORS.SERVICE_UNAVAILABLE]: {
      message: "Service unavailable",
      code: AcrossErrorCode.UPSTREAM_HTTP_ERROR,
    },
    [UPSTREAM_SWAP_PROVIDER_ERRORS.UNKNOWN_ERROR]: {
      message: "Unknown error",
      code: AcrossErrorCode.UPSTREAM_HTTP_ERROR,
    },
  };

  for (const [code, mapping] of Object.entries(upstreamErrorToAcrossApiError)) {
    const errors = upstreamSwapProviderErrors.filter(
      (error) => error.code === code
    );
    if (errors.length > 0) {
      return new SwapQuoteUnavailableError(
        {
          message: mapping.message,
          code: mapping.code,
        },
        {
          cause: errors,
        }
      );
    }
  }

  if (swapQuoteUnavailableErrors.length > 0) {
    return swapQuoteUnavailableErrors[0];
  }

  if (otherAcrossApiErrors.length > 0) {
    return otherAcrossApiErrors[0];
  }

  if (upstreamAcrossApiErrors.length > 0) {
    const upstreamErrorToAcrossApiError =
      upstreamAcrossApiErrors[0].response?.data;

    return new SwapQuoteUnavailableError(
      {
        message: upstreamErrorToAcrossApiError.message,
        code: upstreamErrorToAcrossApiError.code,
      },
      {
        cause: upstreamAcrossApiErrors.map((error) => compactAxiosError(error)),
      }
    );
  }

  return new SwapQuoteUnavailableError(
    {
      message: "No swap quotes currently available",
      code: AcrossErrorCode.SWAP_QUOTE_UNAVAILABLE,
    },
    { cause: errors.map((error) => compactAxiosError(error)) }
  );
}
