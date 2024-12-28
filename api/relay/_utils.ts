import { assert, Infer, type } from "superstruct";
import { utils } from "ethers";

import { hexString, positiveIntStr, validAddress } from "../_utils";
import { getPermitTypedData } from "../_permit";
import { InvalidParamError } from "../_errors";
import {
  getDepositTypedData,
  getSwapAndDepositTypedData,
} from "../_spoke-pool-periphery";

export const GAS_SPONSOR_ADDRESS = "0x0000000000000000000000000000000000000000";

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

export async function verifySignatures(params: {
  methodNameAndArgs: ReturnType<typeof validateMethodArgs>;
  signatures: {
    permit: string;
    deposit: string;
  };
  originChainId: number;
  entryPointContractAddress: string;
}) {
  const {
    methodNameAndArgs,
    signatures,
    originChainId,
    entryPointContractAddress,
  } = params;
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
      chainId: originChainId,
      ownerAddress: signatureOwner,
      spenderAddress: entryPointContractAddress,
      value: depositData.inputAmount,
      deadline: Number(deadline),
    });
    getDepositTypedDataPromise = getDepositTypedData({
      chainId: originChainId,
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
      chainId: originChainId,
      ownerAddress: signatureOwner,
      spenderAddress: entryPointContractAddress,
      value: swapAndDepositData.swapTokenAmount,
      deadline: Number(deadline),
    });
    getDepositTypedDataPromise = getSwapAndDepositTypedData({
      chainId: originChainId,
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
