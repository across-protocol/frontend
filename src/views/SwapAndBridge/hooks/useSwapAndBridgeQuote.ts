import { useMemo } from "react";
import { BigNumber, utils } from "ethers";
import { useTransferQuote } from "views/Bridge/hooks/useTransferQuote";
import { findEnabledRoute } from "views/Bridge/utils";
import { TokenWithBalance } from "./useSwapAndBridgeTokens";
import useSwapQuote from "./useSwapQuote";
import { defaultSwapSlippage, fixedPointAdjustment } from "utils/constants";
import { ConvertDecimals } from "utils/convertdecimals";
import { SwapApprovalApiCallReturnType } from "utils/serverless-api/prod/swap-approval";
import { TransferQuote } from "views/Bridge/hooks/useTransferQuote";

type Params = {
  inputToken: TokenWithBalance | null;
  outputToken: TokenWithBalance | null;
  amount: BigNumber | null;
  isInputAmount: boolean;
  depositor: string | undefined;
  recipient: string | undefined;
};

/**
 * Fee item structure for display in UI
 */
export type FeeItem = {
  label: string;
  value: number; // Always USD value
  description?: string; // Optional description for tooltip
};

/**
 * Normalized quote type for swap and bridge
 */
export type NormalizedQuote = {
  // Common fields
  inputAmount: BigNumber;
  expectedOutputAmount: BigNumber;
  inputToken: {
    address: string;
    chainId: number;
    symbol: string;
    decimals: number;
  };
  outputToken: {
    address: string;
    chainId: number;
    symbol: string;
    decimals: number;
  };
  // Fees breakdown as array of fee items
  fees: FeeItem[];
  // Estimated fill time in seconds
  estimatedFillTimeSeconds?: number;
  // Quote type
  quoteType: "swap" | "bridge";
  // Original quote data for type-specific access
  swapQuote?: SwapApprovalApiCallReturnType;
  bridgeQuote?: TransferQuote;
  // Approval data (only for swap quotes)
  approvalTxns?: Array<{
    chainId: number;
    to: string;
    data: string;
  }>;
  swapTx?: SwapApprovalApiCallReturnType["swapTx"];
};

/**
 * - If either token is bridge-only, uses useTransferQuote (suggested-fees endpoint)
 * - If both tokens are swap tokens, uses useSwapQuote
 */
export function useSwapAndBridgeQuote(params: Params) {
  const {
    inputToken,
    outputToken,
    amount,
    isInputAmount,
    depositor,
    recipient,
  } = params;

  // Check if either token is bridge-only
  const isInputBridgeOnly = useMemo(() => {
    if (!inputToken) return false;
    return (
      inputToken.routeSource?.includes("bridge") &&
      !inputToken.routeSource?.includes("swap")
    );
  }, [inputToken]);

  const isOutputBridgeOnly = useMemo(() => {
    if (!outputToken) return false;
    return (
      outputToken.routeSource?.includes("bridge") &&
      !outputToken.routeSource?.includes("swap")
    );
  }, [outputToken]);

  const isBridgeOnlyRoute = isInputBridgeOnly || isOutputBridgeOnly;

  // Check if both tokens are swap tokens (neither is bridge-only)
  const isSwapOnlyRoute = useMemo(() => {
    if (!inputToken || !outputToken) return false;
    return (
      !isInputBridgeOnly &&
      !isOutputBridgeOnly &&
      (inputToken.routeSource?.includes("swap") ||
        outputToken.routeSource?.includes("swap"))
    );
  }, [inputToken, outputToken, isInputBridgeOnly, isOutputBridgeOnly]);

  // Construct SelectedRoute for bridge quotes
  const selectedRoute = useMemo(() => {
    if (!isBridgeOnlyRoute || !inputToken || !outputToken) return undefined;

    // Don't filter by toChain, use externalProjectId to match the route
    const toChain = outputToken.externalProjectId
      ? undefined
      : outputToken.chainId;

    return findEnabledRoute({
      inputTokenSymbol: inputToken.symbol,
      outputTokenSymbol: outputToken.symbol,
      fromChain: inputToken.chainId,
      toChain,
      externalProjectId: outputToken.externalProjectId,
      type: "bridge",
    });
  }, [isBridgeOnlyRoute, inputToken, outputToken]);

  // Create a minimal route for useTransferQuote when selectedRoute is undefined
  // The query will be disabled internally if the route is invalid
  const fallbackRoute = useMemo(() => {
    if (!inputToken || !outputToken) {
      // Return a minimal valid route structure to prevent undefined errors
      // This route won't be used since the query will be disabled
      return {
        fromChain: 1,
        toChain: 1,
        fromTokenSymbol: "",
        toTokenSymbol: "",
        fromTokenAddress: "",
        toTokenAddress: "",
        isNative: false,
        l1TokenAddress: "",
        fromSpokeAddress: "",
        externalProjectId: undefined,
        type: "bridge" as const,
      };
    }
    return {
      fromChain: inputToken.chainId,
      toChain: outputToken.chainId,
      fromTokenSymbol: inputToken.symbol,
      toTokenSymbol: outputToken.symbol,
      fromTokenAddress: inputToken.address,
      toTokenAddress: outputToken.address,
      isNative: false,
      l1TokenAddress: inputToken.address,
      fromSpokeAddress: "",
      externalProjectId:
        inputToken.externalProjectId || outputToken.externalProjectId,
      type: "bridge" as const,
    };
  }, [inputToken, outputToken]);

  // Bridge quote (enabled if either token is bridge-only and route is found)
  // Always pass a valid route to prevent undefined errors
  const routeForBridgeQuote = selectedRoute || fallbackRoute;
  // Only enable bridge quote if we have a bridge-only route
  const shouldFetchBridgeQuote =
    isBridgeOnlyRoute && !!selectedRoute && amount?.gt(0);
  const bridgeQuoteResult = useTransferQuote(
    routeForBridgeQuote,
    amount || BigNumber.from(0),
    defaultSwapSlippage,
    depositor,
    recipient,
    shouldFetchBridgeQuote
  );

  // Swap quote (enabled only if both tokens are swap tokens, not bridge-only)
  const swapQuoteResult = useSwapQuote({
    origin: inputToken,
    destination: outputToken,
    amount,
    isInputAmount,
    depositor,
    recipient,
    enabled: isSwapOnlyRoute && amount?.gt(0),
  });

  // Determine which quote to use and normalize the data
  const normalizedQuote: NormalizedQuote | undefined = useMemo(() => {
    // Reset quote if amount is empty/null/zero to prevent stale data
    if (!amount || amount.isZero() || amount.lte(0)) {
      return undefined;
    }

    // Reset quote if tokens are missing to prevent stale data when tokens change
    if (!inputToken || !outputToken) {
      return undefined;
    }

    if (isBridgeOnlyRoute && bridgeQuoteResult) {
      const bridgeQuote = bridgeQuoteResult.transferQuoteQuery.data;
      if (!bridgeQuote || !inputToken || !outputToken || !selectedRoute)
        return undefined;

      // Extract fees from bridge quote and convert to USD
      // Following the same logic as calcFeesForEstimatedTable
      const fees: FeeItem[] = [];
      let totalFeeUsd = 0;
      let bridgeFeeUsd = 0;

      if (
        bridgeQuote.quotedFees &&
        bridgeQuote.quotePriceUSD &&
        bridgeQuote.quotedFees.lpFee?.total &&
        bridgeQuote.quotedFees.relayerCapitalFee?.total &&
        bridgeQuote.quotedFees.relayerGasFee?.total
      ) {
        const price = BigNumber.from(bridgeQuote.quotePriceUSD);
        const bridgeTokenDecimals = inputToken.decimals || 18;

        // Convert BigNumber fees to token amounts
        const lpFee = BigNumber.from(bridgeQuote.quotedFees.lpFee.total);
        const capitalFee = BigNumber.from(
          bridgeQuote.quotedFees.relayerCapitalFee.total
        );
        const gasFee = BigNumber.from(
          bridgeQuote.quotedFees.relayerGasFee.total
        );

        // Add these together for consistency with swap quotes
        const bridgeFee = capitalFee.add(lpFee).add(gasFee);

        // Convert to USD using the same method as calcFeesForEstimatedTable and convertBridgeTokenToUsd:
        // 1. Convert from token decimals to 18 decimals
        // 2. Multiply by price (already in 18 decimals)
        // 3. Divide by fixedPointAdjustment (10^18)
        const convertToUsd = (amount: BigNumber) => {
          const convertedAmount = ConvertDecimals(
            bridgeTokenDecimals,
            18
          )(amount);
          return price.mul(convertedAmount).div(fixedPointAdjustment);
        };

        const bridgeFeeUsdBn = convertToUsd(bridgeFee);

        // Convert BigNumber USD values to numbers for display
        bridgeFeeUsd = Number(utils.formatEther(bridgeFeeUsdBn));

        // For bridge-only routes, swapFeeUsd = 0, so totalFeeUsd = bridgeFeeUsd
        totalFeeUsd = bridgeFeeUsd;

        // Build fees array
        if (totalFeeUsd > 0) {
          fees.push({
            label: "Total Fee",
            value: totalFeeUsd,
            description: "Sum of bridge and swap fees",
          });
        }
        if (bridgeFeeUsd > 0) {
          fees.push({
            label: "Bridge Fee",
            value: bridgeFeeUsd,
            description:
              "Includes relayer capital fees, LP fees, and destination gas fees",
          });
        }
      }

      // Get output amount from quoteForAnalytics (it has toAmount, not outputAmount)
      // toAmount is already formatted as a string in token units (not wei)
      const outputAmountStr = bridgeQuote.quoteForAnalytics?.toAmount || "0";
      const outputAmountWei = utils.parseUnits(
        outputAmountStr,
        outputToken.decimals || 18
      );

      // Extract estimated fill time from bridge quote
      // estimatedTime is a ConfirmationDepositTimeType object, extract seconds from estimatedFillTimeSec
      const estimatedFillTimeSeconds = bridgeQuote.quotedFees
        ?.estimatedFillTimeSec
        ? bridgeQuote.quotedFees.estimatedFillTimeSec
        : undefined;

      return {
        inputAmount: bridgeQuote.initialAmount || amount,
        expectedOutputAmount: outputAmountWei,
        inputToken: {
          address: inputToken.address,
          chainId: inputToken.chainId,
          symbol: inputToken.symbol,
          decimals: inputToken.decimals,
        },
        outputToken: {
          address: outputToken.address,
          chainId: outputToken.chainId,
          symbol: outputToken.symbol,
          decimals: outputToken.decimals,
        },
        fees,
        estimatedFillTimeSeconds,
        quoteType: "bridge",
        bridgeQuote,
      };
    } else if (swapQuoteResult.data) {
      const swapQuote = swapQuoteResult.data;
      if (!swapQuote || !inputToken || !outputToken) return undefined;

      // Verify quote tokens match current tokens to prevent stale data when tokens change
      if (
        swapQuote.inputToken.address.toLowerCase() !==
          inputToken.address.toLowerCase() ||
        swapQuote.inputToken.chainId !== inputToken.chainId ||
        swapQuote.outputToken.address.toLowerCase() !==
          outputToken.address.toLowerCase() ||
        swapQuote.outputToken.chainId !== outputToken.chainId
      ) {
        return undefined;
      }

      // Extract fees from swap quote structure (as it was done in ConfirmationButton)
      const fees: FeeItem[] = [];
      let totalFeeUsd = 0;
      let bridgeFeeUsd = 0;
      let swapImpactUsd = 0;
      let appFeeUsd = 0;

      if (swapQuote.fees?.total) {
        // Total fee
        totalFeeUsd = Number(swapQuote.fees.total.amountUsd || 0);

        // Bridge fee
        if (swapQuote.fees.total.details?.bridge?.amountUsd) {
          bridgeFeeUsd = Number(swapQuote.fees.total.details.bridge.amountUsd);
        }

        // Swap impact
        if (swapQuote.fees.total.details?.swapImpact?.amountUsd) {
          swapImpactUsd = Number(
            swapQuote.fees.total.details.swapImpact.amountUsd
          );
        }

        // App fee (if present)
        if (swapQuote.fees.total.details?.app?.amountUsd) {
          appFeeUsd = Number(swapQuote.fees.total.details.app.amountUsd);
        }

        // Build fees array
        if (totalFeeUsd > 0) {
          fees.push({
            label: "Total Fee",
            value: totalFeeUsd,
            description: "Sum of bridge and swap fees",
          });
        }
        if (bridgeFeeUsd > 0) {
          fees.push({
            label: "Bridge Fee",
            value: bridgeFeeUsd,
            description: "Includes destination gas, relayer fees, and LP fees",
          });
        }
        if (swapImpactUsd > 0) {
          fees.push({
            label: "Swap Impact",
            value: swapImpactUsd,
            description:
              "Estimated price difference from pool depth and trade size",
          });
        }
        if (appFeeUsd > 0) {
          fees.push({
            label: "App Fee",
            value: appFeeUsd,
          });
        }
      }

      return {
        inputAmount: BigNumber.from(swapQuote.inputAmount),
        expectedOutputAmount: BigNumber.from(swapQuote.expectedOutputAmount),
        inputToken: swapQuote.inputToken,
        outputToken: swapQuote.outputToken,
        fees,
        estimatedFillTimeSeconds: swapQuote.expectedFillTime,
        quoteType: "swap",
        swapQuote,
        approvalTxns: swapQuote.approvalTxns,
        swapTx: swapQuote.swapTx,
      };
    }
  }, [
    isBridgeOnlyRoute,
    bridgeQuoteResult,
    inputToken,
    outputToken,
    amount,
    selectedRoute,
    swapQuoteResult.data,
  ]);

  // Determine loading and error states
  // Mimic the logic from useBridge.ts - check transferQuoteQuery, feesQuery, and conditionally
  // check swapQuoteQuery/universalSwapQuoteQuery based on route type
  // Also check if we don't have a quote yet (!transferQuote) when we should be fetching one
  const transferQuote = bridgeQuoteResult.transferQuoteQuery.data;
  const bridgeQuoteIsLoading =
    shouldFetchBridgeQuote &&
    (bridgeQuoteResult.transferQuoteQuery.isLoading ||
      bridgeQuoteResult.feesQuery.isLoading ||
      (routeForBridgeQuote.type === "swap"
        ? bridgeQuoteResult.swapQuoteQuery.isLoading
        : false) ||
      ((routeForBridgeQuote.type === "universal-swap"
        ? bridgeQuoteResult.universalSwapQuoteQuery.isLoading
        : false) &&
        !transferQuote));

  const isLoading = bridgeQuoteIsLoading || swapQuoteResult.isLoading;

  const error =
    isBridgeOnlyRoute && selectedRoute
      ? bridgeQuoteResult.transferQuoteQuery.error
      : !isBridgeOnlyRoute
        ? swapQuoteResult.error
        : selectedRoute
          ? undefined
          : new Error("No route found for bridge-only tokens");

  return {
    data: normalizedQuote,
    isLoading,
    error,
    // Expose underlying queries for advanced usage
    bridgeQuoteResult: isBridgeOnlyRoute ? bridgeQuoteResult : undefined,
    swapQuoteResult: !isBridgeOnlyRoute ? swapQuoteResult : undefined,
  };
}
