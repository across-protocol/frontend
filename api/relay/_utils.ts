import { assert, Infer, type } from "superstruct";
import { utils } from "ethers";

import { bytes32, hexString, positiveIntStr, validAddress } from "../_utils";
import { getPermitTypedData } from "../_permit";
import { InvalidParamError } from "../_errors";
import {
  encodeDepositWithAuthCalldata,
  encodeDepositWithPermitCalldata,
  encodeSwapAndBridgeWithAuthCalldata,
  encodeSwapAndBridgeWithPermitCalldata,
  getDepositTypedData,
  getSwapAndDepositTypedData,
} from "../_spoke-pool-periphery";
import { RelayRequest } from "./_types";
import { redisCache } from "../_cache";
import { getTransferWithAuthTypedData } from "../_transfer-with-auth";

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

const DepositDataSchema = type({
  submissionFees: SubmissionFeesSchema,
  baseDepositData: BaseDepositDataSchema,
  inputAmount: positiveIntStr(),
});

export const DepositWithPermitArgsSchema = type({
  signatureOwner: validAddress(),
  depositData: DepositDataSchema,
  deadline: positiveIntStr(),
});

export const SwapAndDepositWithPermitArgsSchema = type({
  signatureOwner: validAddress(),
  swapAndDepositData: SwapAndDepositDataSchema,
  deadline: positiveIntStr(),
});

export const DepositWithAuthArgsSchema = type({
  signatureOwner: validAddress(),
  depositData: DepositDataSchema,
  validAfter: positiveIntStr(),
  validBefore: positiveIntStr(),
  nonce: bytes32(),
});

export const SwapAndDepositWithAuthArgsSchema = type({
  signatureOwner: validAddress(),
  swapAndDepositData: SwapAndDepositDataSchema,
  validAfter: positiveIntStr(),
  validBefore: positiveIntStr(),
  nonce: bytes32(),
});

export const allowedMethodNames = [
  "depositWithPermit",
  "swapAndBridgeWithPermit",
  "depositWithAuthorization",
  "swapAndBridgeWithAuthorization",
] as const;

export function validateMethodArgs(
  methodName: (typeof allowedMethodNames)[number],
  args: any
) {
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
  } else if (methodName === "depositWithAuthorization") {
    assert(args, DepositWithAuthArgsSchema);
    return {
      args: args as Infer<typeof DepositWithAuthArgsSchema>,
      methodName,
    } as const;
  } else if (methodName === "swapAndBridgeWithAuthorization") {
    assert(args, SwapAndDepositWithAuthArgsSchema);
    return {
      args: args as Infer<typeof SwapAndDepositWithAuthArgsSchema>,
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
  let getPermitTypedDataPromise:
    | ReturnType<typeof getPermitTypedData>
    | undefined;
  let getDepositTypedDataPromise: ReturnType<
    typeof getDepositTypedData | typeof getSwapAndDepositTypedData
  >;
  let getTransferWithAuthTypedDataPromise:
    | ReturnType<typeof getTransferWithAuthTypedData>
    | undefined;

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
  } else if (methodName === "depositWithAuthorization") {
    const {
      signatureOwner: _signatureOwner,
      validAfter,
      validBefore,
      nonce,
      depositData,
    } = args;
    signatureOwner = _signatureOwner;
    getTransferWithAuthTypedDataPromise = getTransferWithAuthTypedData({
      tokenAddress: depositData.baseDepositData.inputToken,
      chainId,
      ownerAddress: signatureOwner,
      spenderAddress: to, // SpokePoolV3Periphery address
      value: depositData.inputAmount,
      validAfter: Number(validAfter),
      validBefore: Number(validBefore),
      nonce,
    });
    getDepositTypedDataPromise = getDepositTypedData({
      chainId,
      depositData,
    });
  } else if (methodName === "swapAndBridgeWithAuthorization") {
    const {
      signatureOwner: _signatureOwner,
      validAfter,
      validBefore,
      nonce,
      swapAndDepositData,
    } = args;
    signatureOwner = _signatureOwner;
    getTransferWithAuthTypedDataPromise = getTransferWithAuthTypedData({
      tokenAddress: swapAndDepositData.swapToken,
      chainId,
      ownerAddress: signatureOwner,
      spenderAddress: to, // SpokePoolV3Periphery address
      value: swapAndDepositData.swapTokenAmount,
      validAfter: Number(validAfter),
      validBefore: Number(validBefore),
      nonce,
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

  if (getPermitTypedDataPromise) {
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
  } else if (getTransferWithAuthTypedDataPromise) {
    const [authTypedData, depositTypedData] = await Promise.all([
      getTransferWithAuthTypedDataPromise,
      getDepositTypedDataPromise,
    ]);

    const recoveredAuthSignerAddress = utils.verifyTypedData(
      authTypedData.eip712.domain,
      authTypedData.eip712.types,
      authTypedData.eip712.message,
      signatures.permit
    );

    if (recoveredAuthSignerAddress !== signatureOwner) {
      throw new InvalidParamError({
        message: "Invalid Authorization signature",
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
  } else if (
    request.methodNameAndArgs.methodName === "depositWithAuthorization"
  ) {
    encodedCalldata = encodeDepositWithAuthCalldata({
      ...request.methodNameAndArgs.args,
      validAfter: Number(request.methodNameAndArgs.args.validAfter),
      validBefore: Number(request.methodNameAndArgs.args.validAfter),
      nonce: request.methodNameAndArgs.args.nonce,
      receiveWithAuthSignature: request.signatures.permit,
      depositDataSignature: request.signatures.deposit,
    });
  } else if (
    request.methodNameAndArgs.methodName === "swapAndBridgeWithAuthorization"
  ) {
    encodedCalldata = encodeSwapAndBridgeWithAuthCalldata({
      ...request.methodNameAndArgs.args,
      validAfter: Number(request.methodNameAndArgs.args.validAfter),
      validBefore: Number(request.methodNameAndArgs.args.validAfter),
      nonce: request.methodNameAndArgs.args.nonce,
      receiveWithAuthSignature: request.signatures.permit,
      depositDataSignature: request.signatures.deposit,
    });
  }
  // TODO: Add cases for `withPermit2`
  else {
    throw new Error(`Can not encode calldata for relay request`);
  }
  return encodedCalldata;
}

export function getRelayRequestHash(request: RelayRequest) {
  return utils.keccak256(
    utils.defaultAbiCoder.encode(
      ["bytes", "bytes"],
      [request.signatures.permit, request.signatures.deposit]
    )
  );
}

type CachedRelayRequest =
  | {
      status: "pending";
      request: RelayRequest;
      messageId: string;
    }
  | {
      status: "success";
      request: RelayRequest;
      txHash: string;
      messageId: string;
    }
  | {
      status: "failure";
      request: RelayRequest;
      error: Error;
      messageId: string;
    }
  | {
      status: "unknown";
    };
// TODO: Refine value
const cachedRelayRequestTTL = 5 * 60 * 60 * 24; // 5 days

export async function getCachedRelayRequest(
  requestOrHash: RelayRequest | string
): Promise<CachedRelayRequest> {
  const cachedRelayRequest = await redisCache.get<CachedRelayRequest>(
    getRelayRequestCacheKey(requestOrHash)
  );

  if (!cachedRelayRequest) {
    return {
      status: "unknown",
    };
  }

  return cachedRelayRequest;
}

export async function setCachedRelayRequestPending(params: {
  messageId: string;
  request: RelayRequest;
}) {
  await redisCache.set(
    getRelayRequestCacheKey(params.request),
    {
      status: "pending",
      messageId: params.messageId,
      request: params.request,
    },
    cachedRelayRequestTTL
  );
}

export async function setCachedRelayRequestFailure(params: {
  request: RelayRequest;
  error: Error;
}) {
  const cachedRelayRequest = await getCachedRelayRequest(params.request);

  if (!cachedRelayRequest || cachedRelayRequest.status === "unknown") {
    throw new Error("Request not found in cache");
  }

  if (cachedRelayRequest.status === "success") {
    throw new Error(
      "Can not set 'failure' status for request that is already successful"
    );
  }

  await redisCache.set(
    getRelayRequestCacheKey(params.request),
    {
      status: "failure",
      messageId: cachedRelayRequest.messageId,
      request: cachedRelayRequest.request,
      error: params.error,
    },
    cachedRelayRequestTTL
  );
}

export async function setCachedRelayRequestSuccess(params: {
  request: RelayRequest;
  txHash: string;
}) {
  const cachedRelayRequest = await getCachedRelayRequest(params.request);

  if (!cachedRelayRequest || cachedRelayRequest.status === "unknown") {
    throw new Error("Request not found in cache");
  }

  await redisCache.set(
    getRelayRequestCacheKey(params.request),
    {
      status: "success",
      messageId: cachedRelayRequest.messageId,
      request: cachedRelayRequest.request,
      txHash: params.txHash,
    },
    cachedRelayRequestTTL
  );
}

function getRelayRequestCacheKey(requestOrHash: RelayRequest | string) {
  const requestHash =
    typeof requestOrHash === "string"
      ? requestOrHash
      : getRelayRequestHash(requestOrHash);
  return `relay-request:${requestHash}`;
}
