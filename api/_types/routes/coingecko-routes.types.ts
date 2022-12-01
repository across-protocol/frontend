import { TypedVercelRequest } from "../generic.types";

export type CoinGeckoInputRequest = TypedVercelRequest<{
  l1Token: string;
  baseCurrencySymbol: string;
  timestamp?: string;
}>;
