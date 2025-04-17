import {
  convertForDepositQuery,
  convertForFillQuery,
} from "views/DepositStatus/utils";
import { DepositEVM, DepositTrackingStrategy, FillEVM } from "./types";
import {
  getDepositByTxHash,
  getFillByDepositTxHash,
  parseFundsDepositedLog,
  providers,
} from "utils";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";
import { LogDescription } from "ethers/lib/utils";

export class DepositTrackingStrategyEVM implements DepositTrackingStrategy {
  async getDeposit(depositTxHash: string, fromChainId: number) {
    return getDepositByTxHash(depositTxHash, fromChainId);
  }

  parseDeposit(
    logs: Array<{
      topics: string[];
      data: string;
    }>
  ) {
    return parseFundsDepositedLog(logs);
  }

  async getFill(
    depositTxHash: string,
    fromChainId: number,
    toChainId: number,
    depositByTxHash: DepositEVM
  ) {
    return getFillByDepositTxHash(
      depositTxHash,
      fromChainId,
      toChainId,
      depositByTxHash
    );
  }

  convertForFillQuery(
    fill: FillEVM,
    fromBridgePagePayload: FromBridgePagePayload
  ) {
    return convertForFillQuery(fill, fromBridgePagePayload);
  }

  convertForDepositQuery(
    data: {
      depositTxReceipt: providers.TransactionReceipt;
      parsedDepositLog: LogDescription;
      depositTimestamp: number;
    },
    fromBridgePagePayload: FromBridgePagePayload
  ) {
    return convertForDepositQuery(data, fromBridgePagePayload);
  }
}
