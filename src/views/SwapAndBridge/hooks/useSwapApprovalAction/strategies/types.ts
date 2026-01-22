import { SwapApprovalQuote } from "utils/serverless-api/prod/swap-approval";

export type SwapApprovalActionStrategy = {
  isConnected(): boolean;
  isWrongNetwork(requiredChainId: number): boolean;
  switchNetwork(requiredChainId: number): Promise<void>;
  execute(approvalData: SwapApprovalQuote): Promise<string>;
};
