import { transfersHistory } from "@across-protocol/sdk-v2";
import { getConfig, getProvider, ChainId, Provider, lowerBounds } from "utils";

export enum TransfersHistoryEvent {
  TransfersUpdated = "TransfersUpdated",
}
const { TransfersHistoryClient } = transfersHistory;

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
} {
  const chains = params.map(({ chainId, spokeAddress }) => {
    return {
      chainId,
      spokePoolContractAddr: spokeAddress,
      provider: getProvider(chainId),
      lowerBoundBlockNumber: lowerBounds[chainId],
    };
  });
  return { chains };
}

let client: transfersHistory.TransfersHistoryClient | undefined;

export default function getClient() {
  if (client) return client;
  const config = getConfig();
  const params = config.getSpokeChainIds().map((chainId) => {
    return {
      chainId,
      spokeAddress: config.getSpokePoolAddress(chainId),
    };
  });
  client = new TransfersHistoryClient(createTxHistoryClientConfig(params));
  // optional
  client.setLogLevel("debug");
  return client;
}
