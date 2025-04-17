import { LogDescription } from "ethers/lib/utils";
import { Deposit } from "hooks/useDeposits";
import { getDepositByTxHash, getFillByDepositTxHash, providers } from "utils";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";

export type DepositEVM = Awaited<ReturnType<typeof getDepositByTxHash>>;
export type FillEVM = Awaited<ReturnType<typeof getFillByDepositTxHash>>;

export type DepositTrackingStrategy = {
  getDeposit: (
    depositTxHash: string,
    fromChainId: number
  ) => Promise<DepositEVM>;
  parseDeposit: (
    logs: Array<{
      topics: string[];
      data: string;
    }>
  ) => LogDescription | undefined;
  getFill: (
    depositTxHash: string,
    fromChainId: number,
    toChainId: number,
    depositByTxHash: DepositEVM
  ) => Promise<FillEVM>;
  convertForDepositQuery: (
    data: {
      depositTxReceipt: providers.TransactionReceipt;
      parsedDepositLog: LogDescription;
      depositTimestamp: number;
    },
    fromBridgePagePayload: FromBridgePagePayload
  ) => Deposit;
  convertForFillQuery: (
    fill: FillEVM,
    fromBridgePagePayload: FromBridgePagePayload
  ) => Deposit;
};
