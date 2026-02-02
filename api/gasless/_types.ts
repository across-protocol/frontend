import { Infer, object, string } from "superstruct";

/**
 * Schema for gasless deposit messages from GCP Pub/Sub (Avro GaslessDepositMessage).
 */
const GaslessDepositSignaturesSchema = object({
  deposit: string(),
  permit: string(),
});

export const GaslessDepositMessageSchema = object({
  gaslessTx: string(),
  signatures: GaslessDepositSignaturesSchema,
});

export type GaslessDepositMessage = Infer<typeof GaslessDepositMessageSchema>;

export type PendingGaslessDeposit = GaslessDepositMessage & {
  messageId?: string;
};

export interface GaslessPendingResponse {
  deposits: PendingGaslessDeposit[];
}
