import { assert, Infer, type } from "superstruct";
import { utils } from "ethers";

import { hexString, positiveIntStr, validAddress } from "../_utils";
import { getPermitTypedData } from "../_permit";
import { InvalidParamError } from "../_errors";
import {
  encodeDepositWithPermitCalldata,
  encodeSwapAndBridgeWithPermitCalldata,
  getDepositTypedData,
  getSwapAndDepositTypedData,
} from "../_spoke-pool-periphery";
import { RelayRequest } from "./_types";
import { redisCache } from "../_cache";

export const GAS_SPONSOR_ADDRESS =
  process.env.GAS_SPONSOR_ADDRESS ??
  "0x0000000000000000000000000000000000000000";

const SubmissionFeesSchema = type({
  amount: positiveIntStr(),
  recipient: validAddress(),
});

const BaseDepositDataSchema = type({
  inputToken: validAddress(),
  outputToken: validAddress(),
  outputAmount: positiveIntStr(),
  depositor: validAddress(),
  recipient: validAddress(),
  destinationChainId: positiveIntStr(),
  exclusiveRelayer: validAddress(),
  quoteTimestamp: positiveIntStr(),
  fillDeadline: positiveIntStr(),
  exclusivityParameter: positiveIntStr(),
  message: hexString(),
});

const SwapAndDepositDataSchema = type({
  submissionFees: SubmissionFeesSchema,
  depositData: BaseDepositDataSchema,
  swapToken: validAddress(),
  exchange: validAddress(),
  transferType: positiveIntStr(),
  swapTokenAmount: positiveIntStr(),
  minExpectedInputTokenAmount: positiveIntStr(),
  routerCalldata: hexString(),
});

export const DepositWithPermitArgsSchema = type({
  signatureOwner: validAddress(),
  depositData: type({
    submissionFees: SubmissionFeesSchema,
    baseDepositData: BaseDepositDataSchema,
    inputAmount: positiveIntStr(),
  }),
  deadline: positiveIntStr(),
});

export const SwapAndDepositWithPermitArgsSchema = type({
  signatureOwner: validAddress(),
  swapAndDepositData: SwapAndDepositDataSchema,
  deadline: positiveIntStr(),
});

export const allowedMethodNames = [
  "depositWithPermit",
  "swapAndBridgeWithPermit",
];

export function validateMethodArgs(methodName: string, args: any) {
  if (methodName === "depositWithPermit") {
    assert(args, DepositWithPermitArgsSchema);
    return {
      args: args as Infer<typeof DepositWithPermitArgsSchema>,
      methodName,
    } as const;
  } else if (methodName === "swapAndBridgeWithPermit") {
    assert(args, SwapAndDepositWithPermitArgsSchema);
    return {
      args: args as Infer<typeof SwapAndDepositWithPermitArgsSchema>,
      methodName,
    } as const;
  }
  throw new Error(`Invalid method name: ${methodName}`);
}

export async function verifySignatures({
  methodNameAndArgs,
  signatures,
  chainId,
  to,
}: RelayRequest) {
  const { methodName, args } = methodNameAndArgs;

  let signatureOwner: string;
  let getPermitTypedDataPromise: ReturnType<typeof getPermitTypedData>;
  let getDepositTypedDataPromise: ReturnType<
    typeof getDepositTypedData | typeof getSwapAndDepositTypedData
  >;

  if (methodName === "depositWithPermit") {
    const { signatureOwner: _signatureOwner, deadline, depositData } = args;
    signatureOwner = _signatureOwner;
    getPermitTypedDataPromise = getPermitTypedData({
      tokenAddress: depositData.baseDepositData.inputToken,
      chainId,
      ownerAddress: signatureOwner,
      spenderAddress: to, // SpokePoolV3Periphery address
      value: depositData.inputAmount,
      deadline: Number(deadline),
    });
    getDepositTypedDataPromise = getDepositTypedData({
      chainId,
      depositData,
    });
  } else if (methodName === "swapAndBridgeWithPermit") {
    const {
      signatureOwner: _signatureOwner,
      deadline,
      swapAndDepositData,
    } = args;
    signatureOwner = _signatureOwner;
    getPermitTypedDataPromise = getPermitTypedData({
      tokenAddress: swapAndDepositData.swapToken,
      chainId,
      ownerAddress: signatureOwner,
      spenderAddress: to, // SpokePoolV3Periphery address
      value: swapAndDepositData.swapTokenAmount,
      deadline: Number(deadline),
    });
    getDepositTypedDataPromise = getSwapAndDepositTypedData({
      chainId,
      swapAndDepositData,
    });
  } else {
    throw new Error(
      `Can not verify signatures for invalid method name: ${methodName}`
    );
  }

  const [permitTypedData, depositTypedData] = await Promise.all([
    getPermitTypedDataPromise,
    getDepositTypedDataPromise,
  ]);

  const recoveredPermitSignerAddress = utils.verifyTypedData(
    permitTypedData.eip712.domain,
    permitTypedData.eip712.types,
    permitTypedData.eip712.message,
    signatures.permit
  );
  if (recoveredPermitSignerAddress !== signatureOwner) {
    throw new InvalidParamError({
      message: "Invalid permit signature",
      param: "signatures.permit",
    });
  }

  const recoveredDepositSignerAddress = utils.verifyTypedData(
    depositTypedData.eip712.domain,
    depositTypedData.eip712.types,
    depositTypedData.eip712.message,
    signatures.deposit
  );
  if (recoveredDepositSignerAddress !== signatureOwner) {
    throw new InvalidParamError({
      message: "Invalid deposit signature",
      param: "signatures.deposit",
    });
  }
}

export function encodeCalldataForRelayRequest(request: RelayRequest) {
  let encodedCalldata: string;

  if (request.methodNameAndArgs.methodName === "depositWithPermit") {
    encodedCalldata = encodeDepositWithPermitCalldata({
      ...request.methodNameAndArgs.args,
      deadline: Number(request.methodNameAndArgs.args.deadline),
      depositDataSignature: request.signatures.deposit,
      permitSignature: request.signatures.permit,
    });
  } else if (
    request.methodNameAndArgs.methodName === "swapAndBridgeWithPermit"
  ) {
    encodedCalldata = encodeSwapAndBridgeWithPermitCalldata({
      ...request.methodNameAndArgs.args,
      deadline: Number(request.methodNameAndArgs.args.deadline),
      swapAndDepositDataSignature: request.signatures.deposit,
      permitSignature: request.signatures.permit,
    });
  } else {
    throw new Error(`Can not encode calldata for relay request`);
  }

  return encodedCalldata;
}

type CachedRelayRequest =
  | {
      status: "pending";
      request: RelayRequest;
      requestId: string;
    }
  | {
      status: "success";
      request: RelayRequest;
      txHash: string;
      requestId: string;
    }
  | {
      status: "failure";
      request: RelayRequest;
      error: Error;
      requestId: string;
    }
  | {
      status: "unknown";
      requestId: string;
    };

export async function getCachedRelayRequest(
  requestId: string
): Promise<CachedRelayRequest> {
  const cachedRelayRequest = await redisCache.get<CachedRelayRequest>(
    getRelayRequestCacheKey(requestId)
  );

  if (!cachedRelayRequest) {
    return {
      requestId,
      status: "unknown",
    };
  }

  return cachedRelayRequest;
}

export async function setCachedRelayRequestPending(params: {
  requestId: string;
  request: RelayRequest;
}) {
  await redisCache.set(
    getRelayRequestCacheKey(params.requestId),
    {
      status: "pending",
      requestId: params.requestId,
      request: params.request,
    },
    60 * 60 * 24 // 1 day
  );
}

export async function setCachedRelayRequestFailure(params: {
  requestId: string;
  request: RelayRequest;
  error: Error;
}) {
  await redisCache.set(
    getRelayRequestCacheKey(params.requestId),
    {
      status: "failure",
      requestId: params.requestId,
      request: params.request,
      error: params.error,
    },
    60 * 60 * 24 // 1 day
  );
}

export async function setCachedRelayRequestSuccess(params: {
  requestId: string;
  request: RelayRequest;
  txHash: string;
}) {
  await redisCache.set(
    getRelayRequestCacheKey(params.requestId),
    {
      status: "success",
      requestId: params.requestId,
      request: params.request,
      txHash: params.txHash,
    },
    60 * 60 * 24 // 1 day
  );
}

function getRelayRequestCacheKey(requestId: string) {
  return `relay-request:${requestId}`;
}
