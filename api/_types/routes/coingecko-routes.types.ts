import { TypedVercelRequest } from "../generic.types";

export type CoinGeckoInputRequest = TypedVercelRequest<{
  l1Token: string;
  destinationId: string;
}>;
