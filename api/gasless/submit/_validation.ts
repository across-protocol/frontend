import {
  type,
  string,
  optional,
  literal,
  enums,
  union,
  array,
  record,
  any,
  Infer,
} from "superstruct";
import { positiveInt, validEvmAddress, hexString } from "../../_utils";

// EIP712 Domain schema
const EIP712DomainSchema = type({
  name: string(),
  version: string(),
  chainId: positiveInt(),
  verifyingContract: validEvmAddress(),
});

// EIP712 Type entry schema (e.g., { name: "from", type: "address" })
const EIP712TypeEntrySchema = type({
  name: string(),
  type: string(),
});

// EIP712 full typed data schema
const EIP712TypedDataSchema = type({
  types: record(string(), array(EIP712TypeEntrySchema)),
  domain: EIP712DomainSchema,
  primaryType: string(),
  message: record(string(), any()),
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
  destinationChainId: string(),
  exclusiveRelayer: string(), // bytes32
  quoteTimestamp: union([string(), positiveInt()]),
  fillDeadline: union([string(), positiveInt()]),
  exclusivityParameter: union([string(), positiveInt()]),
  message: string(), // bytes
});

// DepositData witness schema
const DepositDataSchema = type({
  submissionFees: FeesSchema,
  baseDepositData: BaseDepositDataSchema,
  inputAmount: string(),
});

// SwapAndDepositData witness schema
const SwapAndDepositDataSchema = type({
  submissionFees: FeesSchema,
  depositData: BaseDepositDataSchema,
  swapToken: validEvmAddress(),
  exchange: validEvmAddress(),
  transferType: union([string(), positiveInt()]),
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
  permit: EIP712TypedDataSchema,
  domainSeparator: hexString(),
  integratorId: optional(string()),
});

// Full GaslessTx schema
export const GaslessTxSchema = type({
  ecosystem: literal("evm-gasless"),
  chainId: positiveInt(),
  to: validEvmAddress(),
  data: GaslessTxDataSchema,
});

// Request body schema for POST /gasless/submit
export const GaslessSubmitBodySchema = type({
  swapTx: GaslessTxSchema,
  signature: hexString(),
});

export type GaslessSubmitBody = Infer<typeof GaslessSubmitBodySchema>;
