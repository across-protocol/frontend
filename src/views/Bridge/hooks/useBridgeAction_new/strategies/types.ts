import { BigNumber } from "ethers";
import { DepositNetworkMismatchProperties } from "ampli";

import { TransferQuote } from "../../useTransferQuote";
import { SelectedRoute } from "../../../utils";

export type DepositArgs = {
  initialAmount: BigNumber;
  amount: BigNumber;
  fromChain: number;
  toChain: number;
  timestamp: BigNumber;
  referrer: string;
  relayerFeePct: BigNumber;
  tokenAddress: string;
  isNative: boolean;
  toAddress: string;
  exclusiveRelayer: string;
  exclusivityDeadline: number;
  integratorId: string;
  externalProjectId?: string;
};

export type DepositActionParams = {
  depositArgs: DepositArgs;
  transferQuote: TransferQuote;
  selectedRoute: SelectedRoute;
  onNetworkMismatch: (
    networkMismatchProperties: DepositNetworkMismatchProperties
  ) => void;
};

export type ApproveTokensParams = Omit<
  DepositActionParams,
  "onNetworkMismatch"
>;

export interface BridgeActionStrategy {
  isConnected(): boolean;
  isWrongNetwork(requiredChainId: number): boolean;
  switchNetwork(requiredChainId: number): Promise<void>;
  approveTokens(params: ApproveTokensParams): Promise<void>;
  sendDepositTx(params: DepositActionParams): Promise<string>;
}
