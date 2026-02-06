export type DepositType = "across" | "cctp" | "oft";

export type DepositsFilters = Partial<{
  originChainId: number;
  destinationChainId: number;
  depositType: DepositType;
  depositor: string;
  recipient: string;
  inputToken: string;
  outputToken: string;
  integratorId: string;
  startBlock: number;
  endBlock: number;
  startFillBlock: number;
  endFillBlock: number;
}>;
