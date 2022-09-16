import { useState } from "react";
import { useSendForm, useBridgeFees, useBridge, useBridgeLimits } from "hooks";
import { confirmations, bridgeDisabled } from "utils";
import { Deposit } from "views/Confirmation";
import { useConnection } from "hooks";

export default function useSendAction(
  onDepositConfirmed: (deposit: Deposit) => void
) {
  const [isInfoModalOpen, setOpenInfoModal] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const toggleInfoModal = () => setOpenInfoModal((oldOpen) => !oldOpen);
  const { fromChain, toChain, amount, tokenSymbol, toAddress, selectedRoute } =
    useSendForm();
  const { fees } = useBridgeFees(amount, fromChain, toChain, tokenSymbol);
  const { limits, isError } = useBridgeLimits(
    selectedRoute?.fromTokenAddress,
    fromChain,
    toChain
  );
  const { status, hasToApprove, send, approve } = useBridge();
  const { account, connect } = useConnection();
  const [txHash, setTxHash] = useState("");

  const handleActionClick = async () => {
    if (status !== "ready" || !selectedRoute || bridgeDisabled) {
      return;
    }
    try {
      setTxPending(true);
      if (hasToApprove) {
        const tx = await approve();
        if (tx) {
          setTxHash(tx.hash);
          tx.wait(confirmations)
            .catch(console.error)
            .finally(() => {
              setTxPending(false);
              setTxHash("");
            });
        }
        return tx;
      } else {
        // We save the fees here, in case they change between here and when we save the deposit.
        const feesUsed = fees;
        const tx = await send();
        // NOTE: This check is redundant, as if `status` is `ready`, all of those are defined.
        if (tx && toAddress && account && feesUsed) {
          setTxHash(tx.hash);
          tx.wait(confirmations)
            .then((tx) => {
              onDepositConfirmed({
                txHash: tx.transactionHash,
                amount,
                tokenAddress: selectedRoute.fromTokenAddress,
                fromChain: selectedRoute.fromChain,
                toChain: selectedRoute.toChain,
                to: toAddress,
                from: account,
                fees: feesUsed,
              });
            })
            .catch(console.error)
            .finally(() => {
              setTxPending(false);
              setTxHash("");
            });
          // TODO: we should invalidate and refetch any queries of the transaction tab, so when a user switches to it, they see the new transaction immediately.
        }
        return tx;
      }
    } catch (error) {
      console.error(error);
      console.error(`Something went wrong sending the transaction`);
      setTxPending(false);
    }
  };

  const buttonDisabled =
    status !== "ready" || txPending || !selectedRoute || bridgeDisabled;

  let buttonMsg: string = "Send";
  if (txPending) {
    buttonMsg = hasToApprove ? "Approving" : "Sending";
  } else if (status === "ready") {
    buttonMsg = hasToApprove ? "Approve" : "Send";
  } else if (status === "validating") {
    buttonMsg = "Loading...";
  } else if (status === "error") {
    buttonMsg = "Send";
  }

  const isWETH = tokenSymbol === "WETH";

  return {
    connect,
    fromChain,
    toChain,
    amount,
    fees,
    tokenSymbol,
    isWETH,
    handleActionClick,
    buttonMsg,
    buttonDisabled,
    isInfoModalOpen,
    toggleInfoModal,
    txPending,
    txHash,
    limits,
    limitsError: isError,
  };
}
