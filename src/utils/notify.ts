import { API } from "bnc-notify";
import { hubPoolChainId, getChainInfo } from "utils";

export function addEtherscan(transaction: any) {
  return {
    link: getChainInfo(hubPoolChainId).constructExplorerLink(transaction.hash),
  };
}

/**
 * Calls and waits on the Notify API to resolve the status of a TX
 * @param txHash The transaction hash to wait for
 * @param notify The BNC Notify API that is used to handle the UI visualization
 * @param timingBuffer An optional waiting time in milliseconds to wait to resolve this promise on a successful tx confirmation. (Default: 5000ms)
 * @param ignoreErrors An optional parameter to ignore tx failure and return successful
 * @returns Nothing.
 */
export const notificationEmitter = async (
  txHash: string,
  notify: API,
  timingBuffer?: number,
  ignoreErrors?: boolean
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const { emitter } = notify.hash(txHash);
    emitter.on("all", addEtherscan);
    emitter.on("txConfirmed", () => {
      notify.unsubscribe(txHash);
      setTimeout(() => {
        resolve();
      }, timingBuffer ?? 0);
    });
    emitter.on("txFailed", () => {
      notify.unsubscribe(txHash);
      if (ignoreErrors) {
        resolve();
      } else {
        reject();
      }
    });
  });
};
