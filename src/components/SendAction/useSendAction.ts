import { useState } from "react";
import { useSendForm, useBridgeFees, useBridge } from "hooks";
import { onboard, TOKENS_LIST, Token, CONFIRMATIONS } from "utils";
import { Deposit } from "views/Confirmation";
import { useConnection } from "state/hooks";

type TokenInfo =
  | {
      address: string;
      symbol: "WETH";
      name: "Wrapped Ether";
      decimals: 18;
      logoURI: string;
      bridgePool: string;
    }
  | Token;

export default function useSendAction(
  onDepositConfirmed: (deposit: Deposit) => void
) {
  const { init } = onboard;
  const [isInfoModalOpen, setOpenInfoModal] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const toggleInfoModal = () => setOpenInfoModal((oldOpen) => !oldOpen);
  const { fromChain, toChain, amount, token, toAddress } = useSendForm();
  const tokenInfo = TOKENS_LIST[fromChain].find(
    (t) => t.address === token
  ) as TokenInfo;
  const { fees } = useBridgeFees(amount, toChain, tokenInfo?.symbol);
  const { status, hasToApprove, send, approve } = useBridge();
  const { account } = useConnection();

  const handleActionClick = async () => {
    if (status !== "ready") {
      return;
    }
    try {
      setTxPending(true);
      if (hasToApprove) {
        const tx = await approve();
        if (tx) {
          tx.wait(CONFIRMATIONS).catch(console.error).finally(() => { setTxPending(false); });
        }
        return tx;
      } else {
        // We save the fees here, in case they change between here and when we save the deposit.
        const feesUsed = fees;
        const tx = await send();
        // NOTE: This check is redundant, as if `status` is `ready`, all of those are defined.
        if (tx && toAddress && account && feesUsed) {
          tx.wait(CONFIRMATIONS)
            .then((tx) => {
              onDepositConfirmed({
                txHash: tx.transactionHash,
                amount,
                token,
                fromChain,
                toChain,
                to: toAddress,
                from: account,
                fees: feesUsed,
              });
            })
            .catch(console.error)
            .finally(() => { setTxPending(false); });
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

  const buttonDisabled = status !== "ready" || txPending;

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

  const isWETH = tokenInfo.symbol === "WETH";

  return {
    init,
    fromChain,
    toChain,
    amount,
    token,
    fees,
    tokenInfo,
    isWETH,
    handleActionClick,
    buttonMsg,
    buttonDisabled,
    isInfoModalOpen,
    toggleInfoModal,
    txPending,
  };
}
