import {
  DepositNetworkMismatchProperties,
  TransferQuoteReceivedProperties,
  ampli,
} from "ampli";
import { BigNumber, constants, providers } from "ethers";
import {
  useConnection,
  useApprove,
  useIsWrongNetwork,
  useAmplitude,
  useQueryParams,
} from "hooks";
import { cloneDeep } from "lodash";
import { useMutation } from "@tanstack/react-query";
import { useHistory } from "react-router-dom";
import {
  GetBridgeFeesResult,
  generateTransferSigned,
  generateTransferSubmitted,
  getConfig,
  getSpokePoolAndVerifier,
  sendSpokePoolVerifierDepositTx,
  sendDepositV3Tx,
  sendSwapAndBridgeTx,
} from "utils";
import { TransferQuote } from "./useTransferQuote";
import { SelectedRoute } from "../utils";
import useReferrer from "hooks/useReferrer";
import { SwapQuoteApiResponse } from "utils/serverless-api/prod/swap-quote";
import { BridgeLimitInterface } from "utils/serverless-api/types";

const config = getConfig();

export type FromBridgePagePayload = {
  expectedFillTime: string;
  timeSigned: number;
  recipient: string;
  referrer: string;
  tokenPrice: string;
  swapQuote?: Omit<SwapQuoteApiResponse, "minExpectedInputTokenAmount"> & {
    minExpectedInputTokenAmount: string;
  };
  selectedRoute: SelectedRoute;
  quote: GetBridgeFeesResult;
  quotedLimits: BridgeLimitInterface;
  quoteForAnalytics: TransferQuoteReceivedProperties;
  depositArgs: DepositArgs;
};

export function useBridgeAction(
  dataLoading: boolean,
  selectedRoute: SelectedRoute,
  usedTransferQuote: TransferQuote
) {
  const { isConnected, signer, account } = useConnection();
  const history = useHistory();
  const { referrer, integratorId } = useReferrer();
  const params = useQueryParams();

  const { isWrongNetworkHandler, isWrongNetwork } = useIsWrongNetwork(
    selectedRoute.fromChain
  );
  const approveHandler = useApprove(selectedRoute.fromChain);
  const { addToAmpliQueue } = useAmplitude();

  const existingIntegrator = params["integrator"];

  const buttonActionHandler = useMutation({
    mutationFn: async () => {
      const frozenQuoteForAnalytics = cloneDeep(
        usedTransferQuote?.quoteForAnalytics
      );
      const frozenInitialQuoteTime = usedTransferQuote?.initialQuoteTime;
      const frozenDepositArgs = cloneDeep(
        getDepositArgs(selectedRoute, usedTransferQuote, referrer, integratorId)
      );
      const frozenSwapQuote = cloneDeep(usedTransferQuote?.quotedSwap);
      const frozenFeeQuote = cloneDeep(usedTransferQuote?.quotedFees);
      const frozenLimits = cloneDeep(usedTransferQuote?.quotedLimits);
      const frozenTokenPrice = cloneDeep(usedTransferQuote?.quotePriceUSD);
      const frozenAccount = cloneDeep(account);
      const frozenRoute = cloneDeep(selectedRoute);
      const isSwapRoute = frozenRoute.type === "swap";

      if (
        !frozenDepositArgs ||
        !signer ||
        !frozenAccount ||
        !frozenFeeQuote ||
        !frozenQuoteForAnalytics ||
        !frozenInitialQuoteTime ||
        !frozenTokenPrice ||
        !frozenLimits ||
        // If swap route, we need also the swap quote
        (isSwapRoute && !frozenSwapQuote)
      ) {
        throw new Error("Missing required data for bridge action");
      }

      await isWrongNetworkHandler();

      // If swap route then we need to approve the swap token for the `SwapAndBridge`
      // contract instead of the `SpokePool` contract.
      if (isSwapRoute && frozenRoute.swapTokenSymbol !== "ETH") {
        if (!frozenSwapQuote) {
          throw new Error("Missing swap quote for swap route");
        }
        const swapAndBridgeAddress = config.getSwapAndBridgeAddress(
          frozenRoute.fromChain,
          frozenSwapQuote.dex
        );
        if (!swapAndBridgeAddress) {
          throw new Error("Missing swap and bridge address");
        }

        await approveHandler.mutateAsync({
          erc20Symbol: frozenRoute.swapTokenSymbol,
          approvalAmount: frozenDepositArgs.initialAmount,
          allowedContractAddress: swapAndBridgeAddress,
        });
      }
      // If normal bridge route then we need to approve the token for the `SpokePool`
      // contract.
      else if (frozenRoute.fromTokenSymbol !== "ETH") {
        await approveHandler.mutateAsync({
          erc20Symbol: frozenRoute.fromTokenSymbol,
          approvalAmount: frozenDepositArgs.amount,
          allowedContractAddress: config.getSpokePoolAddress(
            frozenRoute.fromChain
          ),
        });
      }

      addToAmpliQueue(() => {
        // Instrument amplitude before sending the transaction for the submit button.
        ampli.transferSubmitted(
          generateTransferSubmitted(
            frozenQuoteForAnalytics,
            referrer,
            frozenInitialQuoteTime
          )
        );
      });
      const timeSubmitted = Date.now();
      const networkMismatchHandler = (
        networkMismatchProperties: DepositNetworkMismatchProperties
      ) => {
        addToAmpliQueue(() => {
          ampli.depositNetworkMismatch(networkMismatchProperties);
        });
      };

      let tx: providers.TransactionResponse;

      if (isSwapRoute) {
        tx = await sendSwapAndBridgeTx(
          signer,
          {
            ...frozenDepositArgs,
            inputTokenAddress: frozenRoute.fromTokenAddress,
            outputTokenAddress: frozenRoute.toTokenAddress,
            swapQuote: frozenSwapQuote!,
            swapTokenAddress: frozenRoute.swapTokenAddress,
            swapTokenAmount: frozenDepositArgs.initialAmount,
            // Current `SwapAndBridge` contract does not support relative exclusivity.
            // Disabling until we update the contract.
            exclusiveRelayer: constants.AddressZero,
            exclusivityDeadline: 0,
            fillDeadline: frozenFeeQuote.fillDeadline,
          },
          networkMismatchHandler
        );
      } else {
        const isExclusive =
          frozenDepositArgs.exclusivityDeadline > 0 &&
          frozenDepositArgs.exclusiveRelayer !== constants.AddressZero;
        const { spokePool, shouldUseSpokePoolVerifier, spokePoolVerifier } =
          await getSpokePoolAndVerifier(frozenRoute);
        tx =
          shouldUseSpokePoolVerifier && !isExclusive && spokePoolVerifier
            ? await sendSpokePoolVerifierDepositTx(
                signer,
                frozenDepositArgs,
                spokePool,
                spokePoolVerifier,
                networkMismatchHandler
              )
            : await sendDepositV3Tx(
                signer,
                {
                  ...frozenDepositArgs,
                  inputTokenAddress: frozenRoute.fromTokenAddress,
                  outputTokenAddress: frozenRoute.toTokenAddress,
                  fillDeadline: frozenFeeQuote.fillDeadline,
                },
                spokePool,
                networkMismatchHandler
              );
      }

      addToAmpliQueue(() => {
        ampli.transferSigned(
          generateTransferSigned(
            frozenQuoteForAnalytics,
            referrer,
            timeSubmitted,
            tx.hash
          )
        );
      });

      const fromBridgePagePayload: FromBridgePagePayload = {
        expectedFillTime: usedTransferQuote.estimatedTime.formattedString,
        timeSigned: Date.now(),
        recipient: frozenDepositArgs.toAddress,
        referrer,
        swapQuote: frozenSwapQuote
          ? {
              ...frozenSwapQuote,
              minExpectedInputTokenAmount:
                frozenSwapQuote?.minExpectedInputTokenAmount.toString(),
            }
          : undefined,
        selectedRoute: frozenRoute,
        quote: frozenFeeQuote,
        quotedLimits: frozenLimits,
        quoteForAnalytics: frozenQuoteForAnalytics,
        depositArgs: frozenDepositArgs,
        tokenPrice: frozenTokenPrice.toString(),
      };
      const statusPageSearchParams = new URLSearchParams({
        originChainId: String(frozenRoute.fromChain),
        destinationChainId: String(frozenRoute.toChain),
        inputTokenSymbol: isSwapRoute
          ? frozenRoute.toTokenSymbol
          : frozenRoute.fromTokenSymbol,
        outputTokenSymbol: frozenRoute.toTokenSymbol,
        referrer,
      });
      if (existingIntegrator) {
        statusPageSearchParams.set("integrator", existingIntegrator);
      }
      history.push(
        `/bridge/${tx.hash}?${statusPageSearchParams}`,
        // This state is stored in session storage and therefore persist
        // after a refresh of the deposit status page.
        { fromBridgePagePayload }
      );
    },
  });

  const buttonDisabled =
    !usedTransferQuote ||
    (isConnected && dataLoading) ||
    buttonActionHandler.isLoading;
  return {
    isConnected,
    buttonActionHandler: buttonActionHandler.mutate,
    isButtonActionLoading: buttonActionHandler.isLoading,
    didActionError: buttonActionHandler.isError,
    buttonLabel: getButtonLabel({
      isConnected,
      isDataLoading: dataLoading,
      isMutating: buttonActionHandler.isLoading,
      isWrongNetwork,
    }),
    buttonDisabled,
  };
}

type DepositArgs = {
  initialAmount: BigNumber;
  amount: BigNumber;
  fromChain: number;
  toChain: number;
  timestamp: BigNumber;
  referrer: string;
  relayerFeePct: BigNumber;
  tokenAddress: string;
  isNative: boolean;
  toAddress: string;
  exclusiveRelayer: string;
  exclusivityDeadline: number;
  integratorId: string;
};
function getDepositArgs(
  selectedRoute: SelectedRoute,
  usedTransferQuote: TransferQuote,
  referrer: string,
  integratorId: string
): DepositArgs | undefined {
  const { amountToBridgeAfterSwap, initialAmount, quotedFees, recipient } =
    usedTransferQuote || {};

  if (
    !usedTransferQuote ||
    !quotedFees ||
    !amountToBridgeAfterSwap ||
    !initialAmount ||
    !recipient
  ) {
    return undefined;
  }

  return {
    initialAmount,
    amount: amountToBridgeAfterSwap,
    fromChain: selectedRoute.fromChain,
    toChain: selectedRoute.toChain,
    timestamp: quotedFees.quoteTimestamp,
    referrer,
    relayerFeePct: quotedFees.totalRelayFee.pct,
    tokenAddress: selectedRoute.fromTokenAddress,
    isNative: selectedRoute.isNative,
    toAddress: recipient,
    exclusiveRelayer: quotedFees.exclusiveRelayer,
    exclusivityDeadline: quotedFees.exclusivityDeadline,
    integratorId,
  };
}

function getButtonLabel(args: {
  isConnected: boolean;
  isDataLoading: boolean;
  isMutating: boolean;
  isWrongNetwork: boolean;
}) {
  if (!args.isConnected) {
    return "Connect wallet";
  }
  if (args.isMutating) {
    return "Confirming...";
  }
  if (args.isWrongNetwork) {
    return "Switch network and confirm transaction";
  }
  return "Confirm transaction";
}
