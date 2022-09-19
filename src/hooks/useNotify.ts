import { useEffect, useState, useCallback } from "react";
import { ContractTransaction } from "ethers";

import { useConnection } from "hooks";
import { supportedNotifyChainIds } from "utils/constants";
import { getChainInfo } from "utils";

type TxStatus = "idle" | "pending" | "success" | "error";

export function useNotify() {
  const [chainId, setChainId] = useState<number | undefined>();
  const [txResponse, setTxResponse] = useState<
    ContractTransaction | undefined
  >();
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txErrorMsg, setTxErrorMsg] = useState<string | undefined>();

  const { notify, setNotifyConfig } = useConnection();

  const cleanup = useCallback(() => {
    if (txResponse) {
      notify.unsubscribe(txResponse.hash);
      setChainId(undefined);
      setTxResponse(undefined);
      setNotifyConfig({
        networkId: 1,
      });
    }
  }, [txResponse, notify, setNotifyConfig]);

  useEffect(() => {
    if (txResponse && chainId) {
      setTxStatus("pending");

      if (supportedNotifyChainIds.includes(chainId)) {
        const { emitter } = notify.hash(txResponse.hash);
        setNotifyConfig({
          networkId: chainId,
        });

        emitter.on("txSent", () => {
          return {
            link: getChainInfo(chainId).constructExplorerLink(txResponse.hash),
          };
        });
        emitter.on("txConfirmed", () => {
          setTxStatus("success");
          cleanup();
        });
        emitter.on("txFailed", () => {
          setTxStatus("error");
          setTxErrorMsg("Tx failed");
          cleanup();
        });
      } else {
        // TODO: We could still trigger notifications for chains that are not supported by Notify.
        // See https://docs.blocknative.com/notify#notification
        txResponse
          .wait()
          .then(() => {
            setTxStatus("success");
          })
          .catch((error) => {
            setTxStatus("error");
            setTxErrorMsg(error.message);
          });
      }
    }
  }, [txResponse, cleanup, setNotifyConfig, chainId, notify]);

  return {
    setChainId,
    setTxResponse,
    txStatus,
    txErrorMsg,
  };
}
