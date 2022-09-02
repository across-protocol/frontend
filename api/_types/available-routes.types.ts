// Types for Available Routes

export type L1TokenMapRouting = Record<string, Record<string, string>>;
export type AvailableRoutesInputQuery = {
  originChainId?: string;
  destinationChainId?: string;
  originToken?: string;
  destinationToken?: string;
};
