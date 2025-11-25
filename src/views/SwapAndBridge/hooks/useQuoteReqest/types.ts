import { BigNumber } from "ethers";
import { EnrichedToken } from "../../components/ChainTokenSelector/ChainTokenSelectorModal";

type QuoteAccount = { accountType: "evm" | "svm"; address: string };

export type Types =
  | {
      type: "SET_ORIGIN_TOKEN";
      payload: EnrichedToken | null;
    }
  | {
      type: "SET_DESTINATION_TOKEN";
      payload: EnrichedToken | null;
    }
  | {
      type: "SET_ORIGIN_AMOUNT";
      payload: BigNumber | null;
    }
  | {
      type: "SET_DESTINATION_AMOUNT";
      payload: BigNumber | null;
    }
  | { type: "SET_ORIGIN_ACCOUNT"; payload: QuoteAccount | null }
  | { type: "SET_DESTINATION_ACCOUNT"; payload: QuoteAccount | null }
  | { type: "QUICK_SWAP"; payload: undefined };

export interface QuoteRequest {
  tradeType: "minOutput" | "exactInput";
  originToken: EnrichedToken | null;
  destinationToken: EnrichedToken | null;
  originAccount: QuoteAccount | null;
  destinationAccount: QuoteAccount | null;
  amount: BigNumber | null;
}
