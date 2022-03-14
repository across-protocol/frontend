import { useState, useMemo } from "react";
import { useSendForm, useBridgeFees, useBridge } from "hooks";
import { onboard, TOKENS_LIST, ChainId, receiveAmount, Token } from "utils";

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

export default function useSendAction() {
  const { init } = onboard;
  const [isInfoModalOpen, setOpenInfoModal] = useState(false);
  const toggleInfoModal = () => setOpenInfoModal((oldOpen) => !oldOpen);
  const { fromChain, toChain, amount, token } = useSendForm();
  const tokenInfo = TOKENS_LIST[fromChain].find(
    (t) => t.address === token
  ) as TokenInfo;
  const { fees } = useBridgeFees(amount, fromChain, tokenInfo?.symbol);
  const { status, hasToApprove, send, approve } = useBridge();

  const amountMinusFees = useMemo(() => {
    if (fromChain === ChainId.MAINNET) {
      return amount;
    }
    return receiveAmount(amount, fees);
  }, [amount, fees, fromChain]);

  const handleClick = async () => {
    if (hasToApprove) {
      const tx = await approve();
      console.log(tx);
    } else {
      const tx = send();
      console.log(tx);
    }
  };

  const buttonDisabled = status !== "ready";

  let buttonMsg: string = "Send";
  if (status === "ready") {
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
    handleClick,
    amountMinusFees,
    buttonMsg,
    buttonDisabled,
    isInfoModalOpen,
    toggleInfoModal,
  };
}
