import { useEffect, useState } from "react";
import { useSendForm, useBridgeFees, useBridge, useBridgeLimits } from "hooks";
import {
  confirmations,
  bridgeDisabled,
  getToken,
  getChainInfo,
  getConfirmationDepositTime,
  receiveAmount,
  generateTransferQuote,
  generateTransferSubmitted,
  generateTransferSigned,
  generateDepositConfirmed,
  recordTransferUserProperties,
  ConfirmationDepositTimeType,
} from "utils";
import { cloneDeep } from "lodash";
import { Deposit } from "views/Confirmation";
import { useConnection } from "hooks";
import { ampli, TransferQuoteReceivedProperties } from "ampli";
import { useCoingeckoPrice } from "hooks/useCoingeckoPrice";
import useReferrer from "hooks/useReferrer";

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
  const { chainId: networkChainId } = useConnection();
  const networkChainName = getChainInfo(networkChainId || 1)?.name!;

  const showFees = amount.gt(0) && !!fees;
  const amountMinusFees = showFees ? receiveAmount(amount, fees) : undefined;
  const toChainInfo = toChain ? getChainInfo(toChain) : undefined;
  const fromChainInfo = fromChain ? getChainInfo(fromChain) : undefined;
  const tokenInfo = tokenSymbol ? getToken(tokenSymbol) : undefined;
  let timeToRelay = "loading";
  let estimatedTimeToRelayObject: ConfirmationDepositTimeType | undefined =
    undefined;
  if (limits && toChain && fromChain) {
    estimatedTimeToRelayObject = getConfirmationDepositTime(
      amount,
      limits,
      toChain,
      fromChain
    );
    timeToRelay = estimatedTimeToRelayObject.formattedString;
  } else if (isError) {
    timeToRelay = "estimation failed";
  }

  const tokenPrice = useCoingeckoPrice(
    selectedRoute?.l1TokenAddress!,
    "usd",
    selectedRoute !== undefined
  );
  const { status, hasToApprove, send, approve } = useBridge();
  const { account, connect } = useConnection();
  const [txHash, setTxHash] = useState("");
  const { referrer } = useReferrer();

  const [quote, setQuote] = useState<
    TransferQuoteReceivedProperties | undefined
  >(undefined);
  const [initialQuoteTime, setInitialQuoteTime] = useState<number | undefined>(
    undefined
  );

  // This use effect instruments amplitude when a new quote is received
  useEffect(() => {
    const tokenPriceInUSD = tokenPrice?.data?.price;
    // Ensure that we have a quote and fees before instrumenting.
    if (
      fees &&
      selectedRoute &&
      tokenInfo &&
      fromChainInfo &&
      toChainInfo &&
      toAddress &&
      account &&
      tokenPriceInUSD &&
      estimatedTimeToRelayObject
    ) {
      const quote: TransferQuoteReceivedProperties = generateTransferQuote(
        fees,
        selectedRoute,
        tokenInfo,
        fromChainInfo,
        toChainInfo,
        toAddress,
        account,
        tokenPriceInUSD,
        estimatedTimeToRelayObject,
        amount
      );
      ampli.transferQuoteReceived(quote);
      setQuote(quote);
      setInitialQuoteTime((s) => s ?? Number(quote.quoteTimestamp));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fees, selectedRoute, tokenInfo]);

  const handleActionClick = async () => {
    const frozenQuote = cloneDeep(quote);
    const price = tokenPrice?.data?.price;
    if (
      status !== "ready" ||
      !selectedRoute ||
      bridgeDisabled ||
      !frozenQuote ||
      !initialQuoteTime ||
      !price ||
      !tokenInfo
    ) {
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
        // Instrument amplitude before sending the transaction for the submit button.
        ampli.transferSubmitted(
          generateTransferSubmitted(frozenQuote, referrer, initialQuoteTime)
        );

        const timeSubmitted = Date.now();

        // We save the fees here, in case they change between here and when we save the deposit.
        const feesUsed = fees;
        const tx = await send();

        // NOTE: This check is redundant, as if `status` is `ready`, all of those are defined.
        if (tx && toAddress && account && feesUsed) {
          const timeSigned = tx.timestamp || timeSubmitted;

          // Instrument amplitude after signing the transaction for the submit button.
          ampli.transferSigned(
            generateTransferSigned(
              frozenQuote,
              referrer,
              timeSubmitted,
              tx.hash
            )
          );
          setTxHash(tx.hash);

          let success = false;
          tx.wait(confirmations)
            .then((tx) => {
              success = tx.status === 1;
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
              // Instrument amplitude after the transaction is confirmed for the submit button.
              ampli.depositTransactionConfirmed(
                generateDepositConfirmed(
                  frozenQuote,
                  referrer,
                  timeSigned,
                  tx.hash,
                  success,
                  tx.timestamp!
                )
              );
              setTxPending(false);
              setTxHash("");
            });
          // Call recordTransferUserProperties to update the user's properties in Amplitude.
          recordTransferUserProperties(
            amount,
            price,
            tokenInfo.decimals,
            frozenQuote.tokenSymbol.toLowerCase(),
            Number(frozenQuote.fromChainId),
            Number(frozenQuote.toChainId),
            networkChainName
          );
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
    showFees,
    amountMinusFees,
    toChainInfo,
    fromChainInfo,
    tokenInfo,
    timeToRelay,
  };
}
