import { transfersHistory } from "@across-protocol/sdk-v2";
import { createTxHistoryClient } from "utils/constants";
export enum TransfersHistoryEvent {
  TransfersUpdated = "TransfersUpdated",
}
const { TransfersHistoryClient } = transfersHistory;

const chainConfigs = createTxHistoryClient();

const client = new TransfersHistoryClient({
  chains: chainConfigs,
});
// optional
client.setLogLevel("debug");

export default client;
