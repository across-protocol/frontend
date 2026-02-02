import {
  type,
  string,
  optional,
  literal,
  enums,
  union,
  object,
  array,
} from "superstruct";
import {
  positiveInt,
  validEvmAddress,
  hexString,
  parsableBigNumberString,
} from "../../_utils";

const EIP712DomainSchema = type({
  name: string(),
  version: string(),
  chainId: positiveInt,
  verifyingContract: validEvmAddress(),
});

const ReceiveWithAuthorizationEIP712Schema = type({
  types: object({
    ReceiveWithAuthorization: array(
      object({
        name: string(),
        type: string(),
      })
    ),
  }),
  domain: EIP712DomainSchema,
  primaryType: literal("ReceiveWithAuthorization"),
  message: object({
    from: validEvmAddress(),
    to: validEvmAddress(),
    value: parsableBigNumberString(),
    validAfter: positiveInt,
    validBefore: positiveInt,
    nonce: hexString(),
  }),
});

// Fees schema (matching SpokePoolPeriphery types)
const FeesSchema = type({
  amount: string(),
  recipient: validEvmAddress(),
});

// Base deposit data schema
const BaseDepositDataSchema = type({
  inputToken: validEvmAddress(),
  outputToken: string(), // bytes32
  outputAmount: string(),
  depositor: validEvmAddress(),
  recipient: string(), // bytes32
  destinationChainId: positiveInt,
  exclusiveRelayer: string(), // bytes32
  quoteTimestamp: positiveInt,
  fillDeadline: positiveInt,
  exclusivityParameter: positiveInt,
  message: string(), // bytes
  exclusivityDeadline: optional(positiveInt),
});

// DepositData witness schema
const DepositDataSchema = type({
  submissionFees: FeesSchema,
  baseDepositData: BaseDepositDataSchema,
  inputAmount: string(),
  spokePool: validEvmAddress(),
  nonce: string(),
});

// SwapAndDepositData witness schema
const SwapAndDepositDataSchema = type({
  submissionFees: FeesSchema,
  depositData: BaseDepositDataSchema,
  swapToken: validEvmAddress(),
  exchange: validEvmAddress(),
  transferType: union([string(), positiveInt]),
  swapTokenAmount: string(),
  minExpectedInputTokenAmount: string(),
  routerCalldata: string(), // bytes
  enableProportionalAdjustment: union([
    string(),
    literal(true),
    literal(false),
  ]),
  spokePool: validEvmAddress(),
  nonce: string(),
});

// Witness schema - union of both witness types
const WitnessSchema = union([
  type({
    type: literal("BridgeWitness"),
    data: DepositDataSchema,
  }),
  type({
    type: literal("BridgeAndSwapWitness"),
    data: SwapAndDepositDataSchema,
  }),
]);

// GaslessTx data schema - extensible for future permit types
const GaslessTxDataSchema = type({
  type: enums(["erc3009"]), // Extend: "permit", "permit2"
  depositId: string(),
  witness: WitnessSchema,
  permit: ReceiveWithAuthorizationEIP712Schema,
  domainSeparator: hexString(),
  integratorId: optional(string()),
});

// Full GaslessTx schema
export const GaslessTxSchema = type({
  ecosystem: literal("evm-gasless"),
  chainId: positiveInt,
  to: validEvmAddress(),
  data: GaslessTxDataSchema,
});

// Request body schema for POST /gasless/submit
export const GaslessSubmitBodySchema = type({
  swapTx: GaslessTxSchema,
  signature: hexString(),
});

// Explicit type definition to avoid Infer issues with custom validators
export type GaslessSubmitBody = {
  swapTx: {
    ecosystem: "evm-gasless";
    chainId: number;
    to: string;
    data: {
      type: "erc3009";
      depositId: string;
      witness:
        | { type: "BridgeWitness"; data: Record<string, unknown> }
        | { type: "BridgeAndSwapWitness"; data: Record<string, unknown> };
      permit: Record<string, unknown>;
      domainSeparator: string;
      integratorId?: string;
    };
  };
  signature: string;
};
