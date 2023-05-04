import { API as NotifyAPI } from "bnc-notify";
import { ContractTransaction } from "ethers";
import { getChainInfo, supportedNotifyChainIds, getProvider } from "utils";

/**
 * Calls and waits on the Notify API to resolve the status of a TX
 * @param requiredChainId Notify supported chain id.
 * @param txHash The transaction hash to wait for
 * @param notify The BNC Notify API that is used to handle the UI visualization
 * @param timingBuffer An optional waiting time in milliseconds to wait to resolve this promise on a successful tx confirmation. (Default: 5000ms)
 * @param ignoreErrors An optional parameter to ignore tx failure and return successful
 * @returns Nothing.
 */
export const notificationEmitter = async (
  requiredChainId: number,
  txHash: string,
  notify: NotifyAPI,
  timingBuffer?: number,
  ignoreErrors?: boolean
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    notify.config({
      networkId: requiredChainId,
    });

    const { emitter } = notify.hash(txHash);
    emitter.on("all", () => {
      return {
        link: getChainInfo(requiredChainId).constructExplorerLink(txHash),
      };
    });
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

/**
 * Calls and waits on the Notify API to resolve the status of a TX if the chain is supported by Onboard
 * @param tx The transaction to wait for
 * @param notify The BNC Notify API that is used to handle the UI visualization
 * @param timingBuffer An optional waiting time in milliseconds to wait to resolve this promise on a successful tx confirmation in Notify (Default: 5000ms)
 * @param ignoreErrors An optional parameter to ignore tx failure and return successful
 **/
export const waitOnTransaction = async (
  requiredChainId: number,
  tx: ContractTransaction,
  notify: NotifyAPI,
  timingBuffer?: number,
  ignoreErrors?: boolean
): Promise<void> => {
  if (supportedNotifyChainIds.includes(requiredChainId)) {
    await notificationEmitter(
      requiredChainId,
      tx.hash,
      notify,
      timingBuffer,
      ignoreErrors
    );
  } else {
    try {
      const provider = getProvider(requiredChainId);
      await provider.waitForTransaction(tx.hash);
    } catch (e) {
      if (!ignoreErrors) {
        throw e;
      }
    }
  }
};
