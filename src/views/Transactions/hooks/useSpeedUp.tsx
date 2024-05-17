import { useState, useEffect } from "react";
import { BigNumber } from "ethers";
import { useMutation } from "react-query";

import { useConnection, useBridgeFees, useIsWrongNetwork } from "hooks";
import {
  getConfig,
  getChainInfo,
  Token,
  waitOnTransaction,
  fixedPointAdjustment,
  getUpdateV3DepositTypedData,
} from "utils";

import type { Deposit } from "hooks/useDeposits";

const config = getConfig();

export function useSpeedUp(transfer: Deposit, token: Token) {
  const { signer, notify, account } = useConnection();
  const { isWrongNetwork, isWrongNetworkHandler } = useIsWrongNetwork(
    transfer.sourceChainId
  );
  const { fees, isLoading } = useBridgeFees(
    BigNumber.from(transfer.amount),
    transfer.sourceChainId,
    transfer.destinationChainId,
    token.symbol,
    transfer.recipientAddr
  );

  const [speedUpTxLink, setSpeedUpTxLink] = useState<string>("");
  const [suggestedRelayerFeePct, setSuggestedRelayerFeePct] = useState<
    BigNumber | undefined
  >();

  useEffect(() => {
    if (fees) {
      setSuggestedRelayerFeePct(fees.totalRelayFee.pct);
    }
  }, [fees]);

  const speedUp = useMutation(
    async (args: {
      newRelayerFeePct: BigNumber;
      optionalUpdates?: Partial<{
        newMessage: string;
        newRecipient: string;
      }>;
    }) => {
      if (!signer || !account) {
        throw new Error("No wallet connected");
      }

      if (transfer.depositorAddr.toLowerCase() !== account.toLowerCase()) {
        throw new Error("Speed up not possible for this deposit");
      }

      if (isWrongNetwork) {
        await isWrongNetworkHandler();
      }

      const newRecipient =
        args.optionalUpdates?.newRecipient || transfer.recipientAddr;
      const newMessage = args.optionalUpdates?.newMessage || transfer.message;
      const updatedOutputAmount = BigNumber.from(transfer.amount).sub(
        args.newRelayerFeePct.mul(transfer.amount).div(fixedPointAdjustment)
      );

      const typedData = getUpdateV3DepositTypedData(
        transfer.depositId,
        transfer.sourceChainId,
        updatedOutputAmount,
        newRecipient,
        newMessage
      );
      const depositorSignature = await signer._signTypedData(
        typedData.domain as Omit<typeof typedData.domain, "salt">,
        typedData.types,
        typedData.message
      );

      const depositor = await signer.getAddress();
      const spokePool = config.getSpokePool(transfer.sourceChainId, signer);
      const txResponse = await spokePool.speedUpV3Deposit(
        depositor,
        transfer.depositId,
        updatedOutputAmount,
        newRecipient,
        newMessage,
        depositorSignature
      );
      setSpeedUpTxLink(
        getChainInfo(transfer.sourceChainId).constructExplorerLink(
          txResponse.hash
        )
      );
      await waitOnTransaction(transfer.sourceChainId, txResponse, notify);
    }
  );

  return {
    speedUp,
    isWrongNetwork,
    isWrongNetworkHandler,
    isFetchingFees: isLoading,
    suggestedRelayerFeePct,
    speedUpTxLink,
  };
}
