import { ampli, TransferQuoteReceivedProperties } from "ampli";
import { BigNumber, ContractTransaction, utils } from "ethers";
import { DateTime } from "luxon";
import { useConnection, useApprove, useIsWrongNetwork } from "hooks";
import { useLocalPendingDeposits } from "hooks/useLocalPendingDeposits";
import { cloneDeep } from "lodash";
import { useMutation } from "react-query";
import {
  AcrossDepositArgs,
  generateDepositConfirmed,
  generateTransferSigned,
  generateTransferSubmitted,
  getConfig,
  getToken,
  recordTransferUserProperties,
  sendAcrossDeposit,
  waitOnTransaction,
} from "utils";

const config = getConfig();

export function useBridgeAction(
  dataLoading: boolean,
  payload?: AcrossDepositArgs,
  tokenSymbol?: string,
  onTransactionComplete?: (hash: string) => void,
  onDepositResolved?: (success: boolean) => void,
  recentQuote?: TransferQuoteReceivedProperties,
  recentInitialQuoteTime?: number,
  tokenPrice?: BigNumber
) {
  const { isConnected, connect, signer, notify, account } = useConnection();

  const { isWrongNetwork, isWrongNetworkHandler } = useIsWrongNetwork(
    payload?.fromChain
  );

  const { addLocalPendingDeposit } = useLocalPendingDeposits();
  const approveHandler = useApprove(payload?.fromChain);

  const buttonActionHandler = useMutation(async () => {
    const frozenQuote = cloneDeep(recentQuote);
    const frozenInitialQuoteTime = recentInitialQuoteTime;
    const frozenPayload = cloneDeep(payload);
    const referrer = frozenPayload?.referrer ?? "";
    const frozenTokenPrice = cloneDeep(tokenPrice);

    if (!isConnected) {
      connect();
      return;
    }

    if (
      !frozenPayload ||
      !signer ||
      !account ||
      !frozenQuote ||
      !frozenInitialQuoteTime ||
      !frozenTokenPrice ||
      !tokenSymbol
    ) {
      return;
    }

    if (isWrongNetwork) {
      await isWrongNetworkHandler();
    }

    if (tokenSymbol !== "ETH") {
      await approveHandler.mutateAsync({
        erc20Address: config.getTokenInfoBySymbol(
          frozenPayload.fromChain,
          tokenSymbol
        ).address,
        approvalAmount: frozenPayload.amount,
        allowedContractAddress: config.getSpokePoolAddress(
          frozenPayload.fromChain
        ),
      });
    }

    let succeeded = false;
    let timeSigned: number | undefined = undefined;
    let tx: ContractTransaction | undefined = undefined;
    try {
      // Instrument amplitude before sending the transaction for the submit button.
      ampli.transferSubmitted(
        generateTransferSubmitted(frozenQuote, referrer, frozenInitialQuoteTime)
      );
      const timeSubmitted = Date.now();

      tx = await sendAcrossDeposit(signer, frozenPayload);

      // Instrument amplitude after signing the transaction for the submit button.
      timeSigned = Date.now();
      ampli.transferSigned(
        generateTransferSigned(frozenQuote, referrer, timeSubmitted, tx.hash)
      );

      if (onTransactionComplete) {
        onTransactionComplete(tx.hash);
      }
      await waitOnTransaction(frozenPayload.fromChain, tx, notify);

      // Optimistically add deposit to local storage for instant visibility on the
      // "My Transactions" page. See `src/hooks/useUserDeposits.ts` for details.
      addLocalPendingDeposit({
        depositId: 0,
        depositTime: DateTime.now().toSeconds(),
        status: "pending",
        filled: "0",
        sourceChainId: frozenPayload.fromChain,
        destinationChainId: frozenPayload.toChain,
        assetAddr: frozenPayload.tokenAddress,
        depositorAddr: utils.getAddress(account),
        amount: frozenPayload.amount.toString(),
        depositTxHash: tx.hash,
        fillTxs: [],
        speedUps: [],
        depositRelayerFeePct: frozenPayload.relayerFeePct.toString(),
        initialRelayerFeePct: frozenPayload.relayerFeePct.toString(),
        suggestedRelayerFeePct: frozenPayload.relayerFeePct.toString(),
      });

      if (onDepositResolved) {
        onDepositResolved(true);
      }
      succeeded = true;
    } catch (e) {
      console.error(e);
      if (onDepositResolved) {
        onDepositResolved(false);
      }
    }
    if (timeSigned && tx) {
      ampli.transferDepositCompleted(
        generateDepositConfirmed(
          frozenQuote,
          referrer,
          timeSigned,
          tx.hash,
          succeeded,
          tx.timestamp!
        )
      );
    }
    // Call recordTransferUserProperties to update the user's properties in Amplitude.
    recordTransferUserProperties(
      frozenPayload.amount,
      frozenTokenPrice,
      getToken(frozenQuote.tokenSymbol).decimals,
      frozenQuote.tokenSymbol.toLowerCase(),
      Number(frozenQuote.fromChainId),
      Number(frozenQuote.toChainId),
      frozenQuote.fromChainName
    );
  });

  const buttonDisabled =
    !payload || (isConnected && dataLoading) || buttonActionHandler.isLoading;

  return {
    isConnected,
    buttonActionHandler: buttonActionHandler.mutate,
    isButtonActionLoading: buttonActionHandler.isLoading,
    buttonLabel: getButtonLabel({
      isConnected,
      isDataLoading: dataLoading,
      isMutating: buttonActionHandler.isLoading,
    }),
    buttonDisabled,
  };
}

function getButtonLabel(args: {
  isConnected: boolean;
  isDataLoading: boolean;
  isMutating: boolean;
}) {
  if (!args.isConnected) {
    return "Connect wallet";
  }
  if (args.isMutating) {
    return "Confirming...";
  }
  if (args.isDataLoading) {
    return "Loading...";
  }
  return "Confirm transaction";
}
