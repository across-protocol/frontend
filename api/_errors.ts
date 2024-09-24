import type { VercelResponse } from "@vercel/node";
import { AxiosError } from "axios";
import { StructError } from "superstruct";
import { relayFeeCalculator, typeguards } from "@across-protocol/sdk";
import { ethers } from "ethers";

type AcrossApiErrorCodeKey = keyof typeof AcrossErrorCode;

type EthersErrorTransaction = {
  from: string;
  to: string;
  data: string;
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
  MISSING_PARAM: "MISSING_PARAM",
  SIMULATION_ERROR: "SIMULATION_ERROR",
  AMOUNT_TOO_LOW: "AMOUNT_TOO_LOW",
  AMOUNT_TOO_HIGH: "AMOUNT_TOO_HIGH",
  ROUTE_NOT_ENABLED: "ROUTE_NOT_ENABLED",

  // Status: 50X
  UPSTREAM_RPC_ERROR: "UPSTREAM_RPC_ERROR",
  UPSTREAM_HTTP_ERROR: "UPSTREAM_HTTP_ERROR",
} as const;

export class AcrossApiError extends Error {
  code?: AcrossApiErrorCodeKey;
  status: number;
  message: string;
  param?: string;

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
    };
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

/**
 * Handles the recurring case of error handling
 * @param endpoint A string numeric to indicate to the logging utility where this error occurs
 * @param response A VercelResponse object that is used to interract with the returning reponse
 * @param logger A logging utility to write to a cloud logging provider
 * @param error The error that will be returned to the user
 * @returns The `response` input with a status/send sent. Note: using this object again will cause an exception
 */
export function handleErrorCondition(
  endpoint: string,
  response: VercelResponse,
  logger: relayFeeCalculator.Logger,
  error: unknown
): VercelResponse {
  let acrossApiError: AcrossApiError;

  // Handle superstruct validation errors
  if (error instanceof StructError) {
    const { type, path } = error;
    // Sanitize the error message that will be sent to client
    const message = `Invalid parameter at path '${path}'. Expected type '${type}'`;
    acrossApiError = new InputError({
      message,
      code: AcrossErrorCode.INVALID_PARAM,
      param: path.join("."),
    });
  }
  // Handle axios errors
  else if (error instanceof AxiosError) {
    const { response } = error;

    // If upstream error is an AcrossApiError, we just return it
    if (response?.data?.type === "AcrossApiError") {
      acrossApiError = new AcrossApiError(
        {
          message: response.data.message,
          status: response.data.status,
          code: response.data.code,
          param: response.data.param,
        },
        { cause: error }
      );
    } else {
      const message = `Upstream http request to ${error.request?.url} failed with ${error.status} ${error.message}`;
      acrossApiError = new AcrossApiError(
        {
          message,
          status: HttpErrorToStatusCode.BAD_GATEWAY,
          code: AcrossErrorCode.UPSTREAM_HTTP_ERROR,
        },
        { cause: error }
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
    acrossApiError = new AcrossApiError(
      {
        message: (error as Error).message,
        status: HttpErrorToStatusCode.INTERNAL_SERVER_ERROR,
      },
      { cause: error }
    );
  }

  const logLevel = acrossApiError.status >= 500 ? "error" : "warn";
  logger[logLevel]({
    at: endpoint,
    message: `Status ${acrossApiError.status} - ${acrossApiError.message}`,
  });

  return response.status(acrossApiError.status).json(acrossApiError);
}

export function resolveEthersError(err: unknown) {
  if (!typeguards.isEthersError(err)) {
    return new AcrossApiError(
      {
        message: err instanceof Error ? err.message : "Unknown error",
        status: HttpErrorToStatusCode.INTERNAL_SERVER_ERROR,
        code: AcrossErrorCode.UPSTREAM_RPC_ERROR,
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
