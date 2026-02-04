import { Deposit } from "hooks/useDeposits";
import type { Token } from "utils/config";

export type { DepositStatusFilter } from "utils/types";

export interface TxLink {
  text: string;
  url: string;
}

export type SupportedTxTuple = [token: Token, tx: Deposit];
