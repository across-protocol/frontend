import { Transfer } from "@across-protocol/sdk-v2/dist/transfers-history";
import { Token } from "utils";

export interface TxLink {
  text: string;
  url: string;
}

export type SupportedTxTuple = [token: Token, tx: Transfer];
