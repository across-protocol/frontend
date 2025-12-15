import { BigNumber } from "ethers";
import { EnrichedToken } from "../../components/ChainTokenSelector/ChainTokenSelectorModal";
import type { ChainEcosystem } from "../../../../constants/chains/types";

export type QuoteAccount = { accountType: ChainEcosystem; address: string };

export type QuoteRequestAction =
  | {
      type: "SET_ORIGIN_TOKEN";
      payload: EnrichedToken | null;
    }
  | {
      type: "SET_DESTINATION_TOKEN";
      payload: EnrichedToken | null;
    }
  | {
      type: "SET_USER_INPUT";
      payload: {
        field: "origin" | "destination";
        value: string;
        amount: BigNumber | null;
      };
    }
  | {
      type: "SET_QUOTE_OUTPUT";
      payload: BigNumber | null;
    }
  | { type: "SET_CUSTOM_DESTINATION_ACCOUNT"; payload: QuoteAccount }
  | { type: "RESET_CUSTOM_DESTINATION_ACCOUNT" }
  | { type: "QUICK_SWAP"; payload: undefined };

export interface QuoteRequest {
  originToken: EnrichedToken | null;
  destinationToken: EnrichedToken | null;
  customDestinationAccount: QuoteAccount | null;
  userInputField: "origin" | "destination";
  userInputValue: string;
  userInputAmount: BigNumber | null;
  quoteOutputAmount: BigNumber | null;
}
