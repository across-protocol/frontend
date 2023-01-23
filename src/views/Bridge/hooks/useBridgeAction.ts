import { ampli, TransferQuoteReceivedProperties } from "ampli";
import { BigNumber, ContractTransaction } from "ethers";
import { useConnection, useERC20 } from "hooks";
import { useAllowance } from "hooks/useAllowance";
import { cloneDeep } from "lodash";
import { useMutation } from "react-query";
import {
  AcrossDepositArgs,
  generateDepositConfirmed,
  generateTransferSigned,
  generateTransferSubmitted,
  getConfig,
  getToken,
  MAX_APPROVAL_AMOUNT,
  recordTransferUserProperties,
  sendAcrossDeposit,
  waitOnTransaction,
} from "utils";

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
  const { isConnected, connect, account, chainId, signer, notify } =
    useConnection();
  const { approve } = useERC20(tokenSymbol ?? "");
  const { allowance } = useAllowance(
    tokenSymbol,
    payload?.fromChain,
    account,
    payload ? getConfig().getSpokePoolAddress(payload.fromChain) : undefined
  );

  const approvalHandler = async () => {
    if (allowance !== undefined && payload && signer) {
      const spokePool = getConfig().getSpokePool(payload.fromChain, signer);
      if (chainId === payload.fromChain) {
        if (allowance.lt(payload.amount)) {
          try {
            const tx = await approve({
              spender: spokePool.address,
              amount: MAX_APPROVAL_AMOUNT,
              signer,
            });
            if (tx) {
              await waitOnTransaction(payload.fromChain, tx, notify);
            }
          } catch (e) {
            console.error(e);
            return;
          }
        }
      }
    }
  };

  const buttonActionHandler = useMutation(async () => {
    const frozenQuote = cloneDeep(recentQuote);
    const frozenInitialQuoteTime = recentInitialQuoteTime;
    const frozenPayload = cloneDeep(payload);
    const referrer = frozenPayload?.referrer ?? "";
    const frozenTokenPrice = cloneDeep(tokenPrice);

    if (!isConnected) {
      connect();
    } else {
      if (
        allowance !== undefined &&
        frozenPayload &&
        signer &&
        chainId === frozenPayload.fromChain &&
        frozenQuote &&
        frozenInitialQuoteTime &&
        frozenTokenPrice
      ) {
        if (allowance.lt(frozenPayload.amount)) {
          await approvalHandler();
        }
        let succeeded = false;
        let timeSigned: number | undefined = undefined;
        let tx: ContractTransaction | undefined = undefined;
        try {
          // Instrument amplitude before sending the transaction for the submit button.
          ampli.transferSubmitted(
            generateTransferSubmitted(
              frozenQuote,
              referrer,
              frozenInitialQuoteTime
            )
          );
          const timeSubmitted = Date.now();

          tx = await sendAcrossDeposit(signer, frozenPayload);

          // Instrument amplitude after signing the transaction for the submit button.
          timeSigned = Date.now();
          ampli.transferSigned(
            generateTransferSigned(
              frozenQuote,
              referrer,
              timeSubmitted,
              tx.hash
            )
          );

          if (onTransactionComplete) {
            onTransactionComplete(tx.hash);
          }
          await waitOnTransaction(frozenPayload.fromChain, tx, notify);
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
      }
    }
  });

  let buttonLabel = "";
  if (!isConnected) {
    buttonLabel = "Connect wallet";
  } else if (payload) {
    if (dataLoading || !allowance) {
      buttonLabel = "Loading...";
    } else {
      if (buttonActionHandler.isLoading) {
        buttonLabel = "Confirming...";
      } else {
        buttonLabel = "Confirm transaction";
      }
    }
  } else {
    buttonLabel = "Confirm transaction";
  }
  const buttonDisabled =
    !payload || (isConnected && dataLoading) || buttonActionHandler.isLoading;

  return {
    isConnected,
    buttonActionHandler: buttonActionHandler.mutateAsync,
    isButtonActionLoading: buttonActionHandler.isLoading,
    buttonLabel,
    buttonDisabled,
  };
}
