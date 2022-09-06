// Types for Available Routes

import { TypedVercelRequest } from "../generic.types";

export type L1TokenMapRouting = Record<string, Record<string, string>>;

type AvailableRoutesInput = {
  originChainId: string;
  destinationChainId: string;
  originToken: string;
  destinationToken: string;
};

export type AvailableRoutesInputRequest =
  TypedVercelRequest<AvailableRoutesInput>;
