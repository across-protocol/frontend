export type ApprovalTxn = {
  chainId: number;
  to: string;
  data: string;
};

export type SwapTx = {
  simulationSuccess: boolean;
  chainId: number;
  to: string;
  data: string;
  value?: string;
  gas?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
};

export type SwapApprovalData = {
  approvalTxns?: ApprovalTxn[];
  swapTx: SwapTx;
};

export type ApproveAndExecuteParams = {
  approvalData: SwapApprovalData;
};

export type SwapApprovalActionStrategy = {
  isConnected(): boolean;
  isWrongNetwork(requiredChainId: number): boolean;
  switchNetwork(requiredChainId: number): Promise<void>;
  execute(approvalData: SwapApprovalData): Promise<string>;
};
