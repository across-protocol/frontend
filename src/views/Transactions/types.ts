import { Deposit } from "hooks/useDeposits";
import { Token } from "utils";

export interface TxLink {
  text: string;
  url: string;
}

export type SupportedTxTuple = [token: Token, tx: Deposit];

export type DepositStatusFilter = "all" | "pending" | "filled";
