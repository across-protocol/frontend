import { transfersHistory } from "@across-protocol/sdk-v2";
import { createTxHistoryClient } from "utils/constants";

const { TransfersHistoryClient } = transfersHistory;

const chainConfigs = createTxHistoryClient();

const client = new TransfersHistoryClient({
  chains: chainConfigs,
  // optional
  pollingIntervalSeconds: 60000,
});
// optional
client.setLogLevel("debug");
// await client.startFetchingTransfers(<depositor_addr>);
// client.on(TransfersHistoryEvent.TransfersUpdated, data => {
//   const { depositorAddr, filledTransfersCount, pendingTransfersCount } = data;
//   // do whatever you need with the data
// });

// const pendingTransfers = client.getPendingTransfers(<depositor_addr>, <limit>, <offset>);
// /**
//  *
//  * Transfers type:
//  * {
//  *   depositId: number;
//  *   depositTime: number;
//  *   status: TransferStatus;
//  *   filled: BigNumber;
//  *   sourceChainId: ChainId;
//  *   destinationChainId: number;
//  *   assetAddr: string;
//  *   amount: BigNumber;
//  *   depositTxHash: string;
//  * }[]
//  */
// const filledTransfers = client.getFilledTransfers(<depositor_addr>, <limit>, <offset>);
// client.stopFetchingTransfers(<depositor_addr>);
