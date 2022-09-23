import { TypedVercelRequest } from "../generic.types";

export type LimitsInputRequest = TypedVercelRequest<{
  token: string;
  destinationChainId: string;
  originChainId: string;
}>;
