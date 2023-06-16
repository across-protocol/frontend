import { useState, useEffect } from "react";
import { BigNumber } from "ethers";
import { utils as sdkUtils } from "@across-protocol/sdk-v2";
import { useMutation } from "react-query";

import { useConnection, useBridgeFees, useIsWrongNetwork } from "hooks";
import { getConfig, getChainInfo, Token, waitOnTransaction } from "utils";

import type { Deposit } from "hooks/useDeposits";

const config = getConfig();

export function useSpeedUp(transfer: Deposit, token: Token) {
  const { signer, notify } = useConnection();
  const { isWrongNetwork, isWrongNetworkHandler } = useIsWrongNetwork(
    transfer.sourceChainId
  );
  const { fees, isLoading } = useBridgeFees(
    BigNumber.from(transfer.amount),
    transfer.sourceChainId,
    transfer.destinationChainId,
    token.symbol
  );

  const [speedUpTxLink, setSpeedUpTxLink] = useState<string>("");
  const [suggestedRelayerFeePct, setSuggestedRelayerFeePct] = useState<
    BigNumber | undefined
  >();

  useEffect(() => {
    if (fees) {
      setSuggestedRelayerFeePct(fees.relayerFee.pct);
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
      if (!signer) {
        return;
      }

      if (isWrongNetwork) {
        await isWrongNetworkHandler();
      }

      const newRecipient =
        args.optionalUpdates?.newRecipient || transfer.recipientAddr;
      const newMessage =
        args.optionalUpdates?.newMessage || transfer.message || "0x";

      const typedData = sdkUtils.getUpdateDepositTypedData(
        transfer.depositId,
        transfer.sourceChainId,
        args.newRelayerFeePct,
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
        args.newRelayerFeePct,
        transfer.depositId,
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
