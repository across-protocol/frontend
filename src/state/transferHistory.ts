import { transfersHistory } from "@across-protocol/sdk-v2";
import { getConfig, getProvider, ChainId, Provider, lowerBounds } from "utils";

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
}[];
export function createTxHistoryClientConfig(params: Params): {
  chains: txHistoryConfig[];
  pollingIntervalSeconds?: number;
} {
  const chains = params.map(({ chainId, spokeAddress }) => {
    return {
      chainId,
      spokePoolContractAddr: spokeAddress,
      provider: getProvider(chainId),
      lowerBoundBlockNumber: lowerBounds[chainId],
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
    };
  });
  const client = new TransfersHistoryClient(
    createTxHistoryClientConfig(params)
  );
  // Uncomment this only for debugging
  // client.setLogLevel("debug");
  return client;
}
