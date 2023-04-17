import { useState, useEffect } from "react";
import { BigNumber } from "ethers";
import { utils as sdkUtils } from "@across-protocol/sdk-v2";

import { useConnection } from "hooks";
import { getConfig, getChainInfo, Token } from "utils";
import { useBridgeFees, useNotify } from "hooks";
import { Deposit } from "hooks/useDeposits";

type SpeedUpStatus = "idle" | "pending" | "success" | "error";

export function useSpeedUp(transfer: Deposit, token: Token) {
  const config = getConfig();
  const { chainId, signer, setChain } = useConnection();
  const { fees, isLoading } = useBridgeFees(
    BigNumber.from(transfer.amount),
    transfer.sourceChainId,
    transfer.destinationChainId,
    token.symbol
  );
  const { setChainId, setTxResponse, txStatus, txErrorMsg } = useNotify();

  const [isCorrectChain, setIsCorrectChain] = useState(false);
  const [speedUpStatus, setSpeedUpStatus] = useState<SpeedUpStatus>("idle");
  const [speedUpErrorMsg, setSpeedUpErrorMsg] = useState<string>("");
  const [speedUpTxLink, setSpeedUpTxLink] = useState<string>("");
  const [suggestedRelayerFeePct, setSuggestedRelayerFeePct] = useState<
    BigNumber | undefined
  >();

  useEffect(() => {
    setIsCorrectChain(chainId === transfer.sourceChainId);
  }, [chainId, transfer.sourceChainId]);

  useEffect(() => {
    if (fees) {
      setSuggestedRelayerFeePct(fees.relayerFee.pct);
    }
  }, [fees]);

  useEffect(() => {
    setSpeedUpStatus(txStatus);

    if (txErrorMsg) {
      setSpeedUpErrorMsg(txErrorMsg);
    }
  }, [txStatus, txErrorMsg]);

  const speedUp = async (
    newRelayerFeePct: BigNumber,
    optionalUpdates: Partial<{
      newMessage?: string;
      newRecipient?: string;
    }> = {}
  ) => {
    try {
      setSpeedUpStatus("pending");
      setSpeedUpErrorMsg("");

      if (!signer) {
        throw new Error(`Wallet is not connected`);
      }

      const newRecipient =
        optionalUpdates.newRecipient || transfer.recipientAddr;
      const newMessage = optionalUpdates.newMessage || transfer.message;

      const typedData = sdkUtils.getUpdateDepositTypedData(
        transfer.depositId,
        transfer.sourceChainId,
        newRelayerFeePct,
        newRecipient,
        newMessage
      );
      const depositorSignature = await signer._signTypedData(
        typedData.domain as Omit<typeof typedData.domain, "salt">,
        typedData.types,
        typedData.message
      );

      const spokePool = config.getSpokePool(transfer.sourceChainId, signer);
      const txResponse = await spokePool.speedUpDeposit(
        await signer.getAddress(),
        newRelayerFeePct,
        transfer.depositId,
        newRecipient,
        newMessage,
        depositorSignature
      );
      setChainId(transfer.sourceChainId);
      setTxResponse(txResponse);
      setSpeedUpTxLink(
        getChainInfo(transfer.sourceChainId).constructExplorerLink(
          txResponse.hash
        )
      );
    } catch (error) {
      setSpeedUpStatus("error");
      setSpeedUpErrorMsg((error as Error).message);
      console.error(error);
    }
  };

  return {
    speedUp,
    speedUpStatus,
    speedUpErrorMsg,
    isCorrectChain,
    setChain,
    isFetchingFees: isLoading,
    suggestedRelayerFeePct,
    speedUpTxLink,
  };
}
