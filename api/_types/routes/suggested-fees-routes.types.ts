import { TypedVercelRequest } from "../generic.types";

export type SuggestedFeesInputRequest = TypedVercelRequest<{
  amount: string;
  token: string;
  timestamp: string;
  destinationChainId: string;
  originChainId: string;
  skipAmountLimit: string;
}>;
