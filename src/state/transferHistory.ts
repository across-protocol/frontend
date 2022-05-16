import { transfersHistory } from "@across-protocol/sdk-v2";
import {
  getConfig,
  getProvider,
  getChainInfo,
  ChainId,
  Provider,
  debug,
} from "utils";

export enum TransfersHistoryEvent {
  TransfersUpdated = "TransfersUpdated",
}
const { TransfersHistoryClient } = transfersHistory;
const POLLING_INTERVAL_SECONDS = 10;

interface txHistoryConfig {
  chainId: number;
  provider: Provider;
  spokePoolContractAddr: string;
  lowerBoundBlockNumber?: number;
}
type Params = {
  chainId: ChainId;
  spokeAddress: string;
  earliestBlock: number;
}[];
export function createTxHistoryClientConfig(params: Params): {
  chains: txHistoryConfig[];
  pollingIntervalSeconds?: number;
} {
  const chains = params.map(({ chainId, spokeAddress, earliestBlock }) => {
    return {
      chainId,
      spokePoolContractAddr: spokeAddress,
      provider: getProvider(chainId),
      lowerBoundBlockNumber: earliestBlock,
    };
  });
  return { chains, pollingIntervalSeconds: POLLING_INTERVAL_SECONDS };
}

export default function getClient() {
  const config = getConfig();
  const params = config.getSpokeChainIds().map((chainId) => {
    return {
      chainId,
      spokeAddress: config.getSpokePoolAddress(chainId),
      earliestBlock: getChainInfo(chainId).earliestBlock,
    };
  });
  const client = new TransfersHistoryClient(
    createTxHistoryClientConfig(params)
  );
  if (debug) client.setLogLevel("debug");
  return client;
}
