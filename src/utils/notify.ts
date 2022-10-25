import { API } from "bnc-notify";
import { hubPoolChainId } from "utils";

export function addEtherscan(transaction: any) {
  return {
    link: `https://etherscan.io/tx/${transaction.hash}`,
  };
}

/**
 * Calls and waits on the Notify API to resolve the status of a TX
 * @param txHash The transaction hash to wait for
 * @param notify The BNC Notify API that is used to handle the UI visualization
 * @returns Nothing.
 */
export const notificationEmitter = async (
  txHash: string,
  notify: API
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const { emitter } = notify.hash(txHash, String(hubPoolChainId));
    emitter.on("all", addEtherscan);
    emitter.on("txConfirmed", () => {
      notify.unsubscribe(txHash);
      setTimeout(() => {
        resolve();
      }, 5000);
    });
    emitter.on("txFailed", () => {
      notify.unsubscribe(txHash);
      reject();
    });
  });
};
