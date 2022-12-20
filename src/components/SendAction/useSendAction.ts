import { useEffect, useState } from "react";
import { useSendForm, useBridgeFees, useBridge, useBridgeLimits } from "hooks";
import {
  confirmations,
  bridgeDisabled,
  getToken,
  formatUnits,
  fixedPointAdjustment,
  formatEther,
  getChainInfo,
  getConfirmationDepositTime,
  receiveAmount,
  formatWeiPct,
} from "utils";
import { Deposit } from "views/Confirmation";
import { useConnection } from "hooks";
import { ampli } from "ampli";
import { useCoingeckoPrice } from "hooks/useCoingeckoPrice";
import { BigNumber } from "ethers";
import { ConvertDecimals } from "utils/convertdecimals";

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

  const showFees = amount.gt(0) && !!fees;
  const amountMinusFees = showFees ? receiveAmount(amount, fees) : undefined;
  const toChainInfo = toChain ? getChainInfo(toChain) : undefined;
  const fromChainInfo = fromChain ? getChainInfo(fromChain) : undefined;
  const tokenInfo = tokenSymbol ? getToken(tokenSymbol) : undefined;
  let timeToRelay = "loading";
  if (limits && toChain && fromChain) {
    timeToRelay = getConfirmationDepositTime(
      amount,
      limits,
      toChain,
      fromChain
    );
  } else if (isError) {
    timeToRelay = "estimation failed";
  }

  const tokenPrice = useCoingeckoPrice(
    selectedRoute?.l1TokenAddress!,
    "usd",
    selectedRoute !== undefined
  );
  // Create a function that converts a wei amount into a formatted token amount
  const formatTokens = (wei: BigNumber) =>
    formatUnits(wei, tokenInfo?.decimals ?? 18);
  // Create a function that converts a wei amount to a USD equivalent
  const usdEquivalent = (wei: BigNumber) =>
    (tokenPrice.data?.price ?? fixedPointAdjustment)
      .mul(
        ConvertDecimals(tokenInfo?.decimals ?? 18, 18)(wei ?? BigNumber.from(0))
      )
      .div(fixedPointAdjustment);
  // Create a function that converts a wei amount to a USD equivalent string
  const usdEquivalentString = (wei: BigNumber) =>
    formatEther(usdEquivalent(wei));
  const formatWeiEtherPct = (wei: BigNumber) => formatWeiPct(wei)!.toString();

  const { status, hasToApprove, send, approve } = useBridge();
  const { account, connect } = useConnection();
  const [txHash, setTxHash] = useState("");

  // This use effect instruments amplitude when a new quote is received
  useEffect(() => {
    // Ensure that we have a quote and fees before instrumenting.
    if (
      fees &&
      selectedRoute &&
      tokenInfo &&
      fromChainInfo &&
      toChainInfo &&
      toAddress &&
      account
    ) {
      ampli.transferQuoteRecieved({
        capitalFeePct: formatWeiEtherPct(fees.relayerCapitalFee.pct),
        capitalFeeTotal: formatTokens(fees.relayerCapitalFee.total),
        capitalFeeTotalUsd: usdEquivalentString(fees.relayerCapitalFee.total),
        expectedFillTimeInMinutes: timeToRelay,
        fromAmount: formatTokens(amount),
        fromAmountUsd: usdEquivalentString(amount),
        fromChainId: selectedRoute.fromChain.toString(),
        fromChainName: fromChainInfo.name,
        isAmountTooLow: fees.isAmountTooLow,
        isSenderEqRecipient: toAddress === account,
        lpFeePct: formatWeiEtherPct(fees.lpFee.pct),
        lpFeeTotal: formatTokens(fees.lpFee.total),
        lpFeeTotalUsd: usdEquivalentString(fees.lpFee.total),
        quoteLatencyMilliseconds: (
          Date.now() - Number(fees.quoteTimestamp?.toString() ?? Date.now())
        ).toString(),
        quoteTimestamp: String(fees.quoteTimestamp ?? Date.now()),
        recipient: toAddress,
        relayFeePct: formatWeiEtherPct(fees.relayerFee.pct),
        relayFeeTotal: formatTokens(fees.relayerFee.total),
        relayFeeTotalUsd: usdEquivalentString(fees.relayerFee.total),
        relayGasFeePct: formatWeiEtherPct(fees.relayerGasFee.pct),
        relayGasFeeTotal: formatTokens(fees.relayerGasFee.total),
        relayGasFeeTotalUsd: usdEquivalentString(fees.relayerGasFee.total),
        sender: account,
        routeChainIdFromTo: toChainInfo.chainId.toString(),
        routeChainNameFromTo: toChainInfo.name,
        toAmount: formatTokens(amount),
        toAmountUsd: usdEquivalentString(amount),
        toChainId: selectedRoute.toChain.toString(),
        toChainName: toChainInfo.name,
        tokenSymbol: tokenInfo.symbol,
        totalBridgeFee: formatTokens(
          fees.relayerCapitalFee.total
            .add(fees.lpFee.total)
            .add(fees.relayerFee.total)
            .add(fees.relayerGasFee.total)
        ),
        totalBridgeFeeUsd: usdEquivalentString(
          fees.relayerCapitalFee.total
            .add(fees.lpFee.total)
            .add(fees.relayerFee.total)
            .add(fees.relayerGasFee.total)
        ),
        totalBridgeFeePct: formatWeiEtherPct(
          fees.relayerCapitalFee.pct
            .add(fees.lpFee.pct)
            .add(fees.relayerFee.pct)
            .add(fees.relayerGasFee.pct)
        ),
        transferQuoteBlockNumber: fees.quoteBlock.toString(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fees, selectedRoute, tokenInfo]);

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
        // Instrument amplitude before sending the transaction for the submit button.

        // We save the fees here, in case they change between here and when we save the deposit.
        const feesUsed = fees;
        const tx = await send();

        // Instrument amplitude after signing the transaction for the submit button.

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
              // Instrument amplitude after the transaction is confirmed for the submit button.

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
    showFees,
    amountMinusFees,
    toChainInfo,
    fromChainInfo,
    tokenInfo,
    timeToRelay,
  };
}
