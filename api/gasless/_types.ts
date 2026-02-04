import {
  Infer,
  type,
  string,
  optional,
  union,
  literal,
  integer,
} from "superstruct";

/**
 * Schema for gasless deposit messages pulled from GCP Pub/Sub (Avro GaslessDepositMessage).
 */
export const GaslessDepositMessageSchema = type({
  swapTx: type({
    ecosystem: string(),
    chainId: integer(),
    to: string(),
    typedData: optional(
      union([
        literal(null),
        type({ TypedDataReceiveWithAuthorizationEIP712: type({}) }),
      ])
    ),
    data: type({
      type: string(),
      depositId: string(),
      witness: union([
        type({ BridgeWitness: type({}) }),
        type({ BridgeAndSwapWitness: type({}) }),
      ]),
      permit: type({}),
      domainSeparator: string(),
      integratorId: optional(union([literal(null), string()])),
    }),
  }),
  signature: string(),
  submittedAt: string(),
  requestId: string(),
});

export type GaslessDepositMessage = Infer<typeof GaslessDepositMessageSchema>;

export type PendingGaslessDeposit = GaslessDepositMessage & {
  messageId?: string;
};

export interface GaslessPendingResponse {
  deposits: PendingGaslessDeposit[];
}
