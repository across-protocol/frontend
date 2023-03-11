import { TransferQuoteReceivedProperties, ampli } from "ampli";
import { BigNumber } from "ethers";
import {
  useBalanceBySymbol,
  useBridgeFees,
  useBridgeLimits,
  useConnection,
  useIsWrongNetwork,
} from "hooks";
import { useCoingeckoPrice } from "hooks/useCoingeckoPrice";
import useReferrer from "hooks/useReferrer";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AcrossDepositArgs,
  generateTransferQuote,
  GetBridgeFeesResult,
  getChainInfo,
  getConfig,
  getConfirmationDepositTime,
  getToken,
  hubPoolChainId,
  trackFromChainChanged,
  trackQuickSwap,
  trackToChainChanged,
  trackTokenChanged,
} from "utils";
import { BridgeLimitInterface } from "utils/serverless-api/types";
import { useBridgeAction } from "./useBridgeAction";
import { useBridgeDepositTracking } from "./useBridgeDepositTracking";

const enabledRoutes = getConfig().getRoutes();

export function useBridge() {
  // Get all available tokens from the enabled routes and use useMemo to avoid
  // recalculating this every time the component re-renders
  const { availableTokens, allFromRoutes, allToRoutes } = useMemo(() => {
    // Map the enabled routes to an array of token symbols and filter for duplicates
    return {
      availableTokens: enabledRoutes
        .map((route) => getToken(route.fromTokenSymbol))
        .filter(
          (token, index, self) =>
            index === self.findIndex((t) => t.symbol === token.symbol)
        ),
      allFromRoutes: enabledRoutes
        .map((route) => getChainInfo(route.fromChain))
        .filter(
          (chain, index, self) =>
            index === self.findIndex((t) => t.chainId === chain.chainId)
        ),
      allToRoutes: enabledRoutes
        .map((route) => getChainInfo(route.toChain))
        .filter(
          (chain, index, self) =>
            index === self.findIndex((t) => t.chainId === chain.chainId)
        ),
    };
  }, []);

  const [currentToken, setCurrentToken] = useState(availableTokens[0].symbol);
  const [isDefaultToken, setIsDefaultToken] = useState(true);
  const [amountToBridge, setAmountToBridge] = useState<BigNumber | undefined>(
    undefined
  );
  const [isBridgeAmountValid, setIsBridgeAmountValid] = useState(false);

  useEffect(() => {
    if (isDefaultToken) {
      trackTokenChanged(currentToken, true);
    }
    setIsDefaultToken(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentToken]);

  // Filter routes to only show routes that are available for the current token when the user changes the token
  // Use useMemo to avoid recalculating this every time the component re-renders
  const availableRoutes = useMemo(() => {
    return enabledRoutes.filter(
      (route) =>
        route.fromTokenSymbol.toLowerCase() === currentToken.toLowerCase()
    );
  }, [currentToken]);

  const [currentToRoute, setCurrentToRoute] = useState<number | undefined>(
    undefined
  );
  const [isDefaultToRoute, setIsDefaultToRoute] = useState(true);
  const [currentFromRoute, setCurrentFromRoute] = useState<number | undefined>(
    undefined
  );
  const [isDefaultFromRoute, setIsDefaultFromRoute] = useState(true);

  useEffect(() => {
    if (currentToRoute) {
      if (isDefaultToRoute) {
        trackToChainChanged(currentToRoute, true);
      }
      setIsDefaultToRoute(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentToRoute]);

  useEffect(() => {
    if (currentFromRoute) {
      if (isDefaultFromRoute) {
        trackFromChainChanged(currentFromRoute, true);
      }
      setIsDefaultFromRoute(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFromRoute]);

  const currentRoute = useMemo(
    () =>
      availableRoutes.find(
        (route) =>
          route.fromChain === currentFromRoute &&
          route.toChain === currentToRoute &&
          route.fromTokenSymbol.toLowerCase() === currentToken.toLowerCase()
      ),
    [availableRoutes, currentFromRoute, currentToRoute, currentToken]
  );

  const currentSelectedTokenPrice = useCoingeckoPrice(
    currentRoute?.l1TokenAddress!,
    "usd",
    currentRoute !== undefined
  );

  // Use useMemo to create an object of available from and to routes for the current token
  // Use useMemo to avoid recalculating this every time the component re-renders
  // Filter to ensure that there are no duplicates by the chain id
  const { availableFromRoutes, availableToRoutes } = useMemo(() => {
    const availableFromRoutes = availableRoutes
      .map((route) => getChainInfo(route.fromChain))
      .filter(
        (chain, index, self) =>
          index === self.findIndex((c) => c.chainId === chain.chainId)
      );
    const availableToRoutes = availableRoutes
      .map((route) => getChainInfo(route.toChain))
      .filter(
        (chain, index, self) =>
          index === self.findIndex((c) => c.chainId === chain.chainId)
      );
    return { availableFromRoutes, availableToRoutes };
  }, [availableRoutes]);

  // Use useEffect to enforce that the currentToRoute and currentFromRoute are always set
  // to a valid route when the user changes the token. If the user changes the token and the
  // current route is no longer available, set the current route to the first available route.
  // If the user changes the token and the current route is still available, keep the current route.
  useEffect(() => {
    if (availableRoutes.length > 0) {
      const availableRoutesThatStartAtCurrentChain = availableRoutes.filter(
        (route) => route.fromChain === (hubPoolChainId ?? 1)
      );

      if (availableRoutesThatStartAtCurrentChain.length === 0) {
        return;
      }

      if (currentToRoute) {
        const toRouteStillAvailable = availableRoutes.some(
          (route) => route.toChain === currentToRoute
        );
        if (!toRouteStillAvailable) {
          setCurrentToRoute(availableRoutes[0].toChain);
        }
      } else {
        setCurrentToRoute(availableRoutesThatStartAtCurrentChain[0].toChain);
      }
      if (currentFromRoute) {
        const fromRouteStillAvailable = availableRoutes.some(
          (route) => route.fromChain === currentFromRoute
        );
        if (!fromRouteStillAvailable) {
          setCurrentFromRoute(availableRoutes[0].fromChain);
        }
      } else {
        setCurrentFromRoute(
          availableRoutesThatStartAtCurrentChain[0].fromChain
        );
      }
    }
  }, [availableRoutes, currentToRoute, currentFromRoute]);

  // If the user changes the from route, ensure that the to route is always set to a valid route for the current token
  // Use useEffect to monitor the currentFromRoute and availableRoutes and set the currentToRoute to the first available route if the current route is no longer available
  useEffect(() => {
    if (availableRoutes.length > 0) {
      if (currentFromRoute) {
        const availableToRoutesForCurrentFromRoute = availableRoutes
          .filter((route) => route.fromChain === currentFromRoute)
          .map((route) => route.toChain);
        if (currentToRoute) {
          const toRouteStillAvailable =
            availableToRoutesForCurrentFromRoute.some(
              (chainId) => chainId === currentToRoute
            );
          if (!toRouteStillAvailable) {
            setCurrentToRoute(availableToRoutesForCurrentFromRoute[0]);
            trackToChainChanged(availableToRoutesForCurrentFromRoute[0], true);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableRoutes, currentFromRoute]);

  // If the user changes the to route, ensure that the from route is always set to a valid route for the current token
  // Use useEffect to monitor the currentToRoute and availableRoutes and set the currentFromRoute to the first available route if the current route is no longer available
  useEffect(() => {
    if (availableRoutes.length > 0) {
      if (currentToRoute) {
        const availableFromRoutesForCurrentToRoute = availableRoutes
          .filter((route) => route.toChain === currentToRoute)
          .map((route) => route.fromChain);
        if (currentFromRoute) {
          const fromRouteStillAvailable =
            availableFromRoutesForCurrentToRoute.some(
              (chainId) => chainId === currentFromRoute
            );
          if (!fromRouteStillAvailable) {
            setCurrentFromRoute(availableFromRoutesForCurrentToRoute[0]);
            trackFromChainChanged(
              availableFromRoutesForCurrentToRoute[0],
              true
            );
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableRoutes, currentToRoute]);

  const [disableQuickSwap, setDisableQuickSwap] = useState(false);

  // Create a function called handleQuickSwap which swaps the from chain and to chain
  // Use useCallback to avoid creating a new function every time the component re-renders
  const handleQuickSwap = useCallback(() => {
    if (currentFromRoute && currentToRoute) {
      // Resolve the from and to route as temporary variables
      const currentFromRouteTemp = currentFromRoute;
      const currentToRouteTemp = currentToRoute;

      if (disableQuickSwap) {
        return;
      }

      // Set the current from route to the current to route
      setCurrentFromRoute(currentToRouteTemp);
      trackFromChainChanged(currentToRouteTemp, false);
      // Set the current to route to the current from route
      setCurrentToRoute(currentFromRouteTemp);
      setAmountToBridge(undefined);
      trackToChainChanged(currentFromRouteTemp, false);
      trackQuickSwap("bridgeForm");
    }
  }, [currentFromRoute, currentToRoute, disableQuickSwap]);

  useEffect(() => {
    // Resolve the from and to route as temporary variables
    const currentFromRouteTemp = currentFromRoute;
    const currentToRouteTemp = currentToRoute;
    // Verify that there's an avaialble route where the from and to
    // chains are inverted and a token is available
    const availableRoute = availableRoutes.some(
      (route) =>
        route.fromChain === currentToRouteTemp &&
        route.toChain === currentFromRouteTemp &&
        route.fromTokenSymbol === currentToken
    );
    setDisableQuickSwap(!availableRoute);
  }, [availableRoutes, currentFromRoute, currentToRoute, currentToken]);

  const usersBalance = useBalanceBySymbol(currentToken, currentFromRoute);
  const currentBalance = usersBalance.balance;

  const {
    isWrongNetwork,
    isWrongNetworkHandlerWithoutError: isWrongNetworkHandler,
    checkWrongNetworkHandler,
  } = useIsWrongNetwork(currentFromRoute);

  const { isConnected, chainId: walletChainId, account } = useConnection();

  useEffect(() => {
    checkWrongNetworkHandler();
  }, [currentFromRoute, isConnected, checkWrongNetworkHandler]);

  const isBridgeDisabled =
    isConnected && (!amountToBridge || amountToBridge.eq(0));

  const { fees: rawFees, isLoading: areRawFeesLoading } = useBridgeFees(
    amountToBridge ?? BigNumber.from(0),
    currentFromRoute,
    currentToRoute,
    currentToken
  );

  const { limits: rawLimits, isLoading: areRawLimitsLoading } = useBridgeLimits(
    currentRoute?.fromTokenAddress,
    currentFromRoute,
    currentToRoute
  );

  const [fees, setFees] = useState<GetBridgeFeesResult | undefined>();
  const [limits, setLimits] = useState<BridgeLimitInterface | undefined>();

  const {
    onTxHashChange,
    trackingTxHash,
    transactionPending,
    explorerUrl,
    transactionElapsedTimeAsFormattedString,
    txCompletedHandler,
  } = useBridgeDepositTracking();

  const estimatedTimeToRelayObject = useMemo(() => {
    return amountToBridge &&
      amountToBridge.gt(0) &&
      currentFromRoute &&
      currentToRoute
      ? limits
        ? getConfirmationDepositTime(
            amountToBridge,
            limits,
            currentToRoute,
            currentFromRoute
          )
        : undefined
      : undefined;
  }, [amountToBridge, currentFromRoute, currentToRoute, limits]);
  const estimatedTime = areRawLimitsLoading
    ? "loading..."
    : limits
    ? estimatedTimeToRelayObject?.formattedString
    : undefined;

  const { referrer } = useReferrer();

  const [displayChangeAccount, setDisplayChangeAccount] = useState(false);
  const [toAccount, setToAccount] = useState<string | undefined>(undefined);

  useEffect(() => {
    setToAccount(account);
  }, [account]);

  const bridgePayload: AcrossDepositArgs | undefined =
    amountToBridge && currentRoute && fees
      ? {
          amount: amountToBridge,
          fromChain: currentRoute.fromChain,
          toChain: currentRoute.toChain,
          timestamp: fees.quoteTimestamp!,
          referrer,
          relayerFeePct: fees.relayerFee.pct,
          tokenAddress: currentRoute.fromTokenAddress,
          isNative: currentRoute.isNative,
          toAddress: toAccount ?? "",
        }
      : undefined;

  const [quote, setQuote] = useState<
    TransferQuoteReceivedProperties | undefined
  >(undefined);
  const [initialQuoteTime, setInitialQuoteTime] = useState<number | undefined>(
    undefined
  );

  // This use effect instruments amplitude when a new quote is received
  useEffect(() => {
    const tokenPriceInUSD = currentSelectedTokenPrice?.data?.price;
    // Ensure that we have a quote and fees before instrumenting.
    if (
      fees &&
      currentRoute &&
      toAccount &&
      account &&
      tokenPriceInUSD &&
      estimatedTimeToRelayObject &&
      amountToBridge
    ) {
      const tokenInfo = getToken(currentRoute.fromTokenSymbol);
      const fromChainInfo = getChainInfo(currentRoute.fromChain);
      const toChainInfo = getChainInfo(currentRoute.toChain);
      const quote: TransferQuoteReceivedProperties = generateTransferQuote(
        fees,
        currentRoute,
        tokenInfo,
        fromChainInfo,
        toChainInfo,
        toAccount,
        account,
        tokenPriceInUSD,
        estimatedTimeToRelayObject,
        amountToBridge
      );
      ampli.transferQuoteReceived(quote);
      setQuote(quote);
      setInitialQuoteTime((s) => s ?? Date.now());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fees, currentRoute]);

  const bridgeAction = useBridgeAction(
    areRawFeesLoading || areRawLimitsLoading,
    bridgePayload,
    currentToken,
    onTxHashChange,
    txCompletedHandler,
    quote,
    initialQuoteTime,
    currentSelectedTokenPrice?.data?.price
  );

  const isBridgeButtonLoading = bridgeAction.isButtonActionLoading;

  useEffect(() => {
    if ((!isBridgeButtonLoading && !trackingTxHash) || !fees) {
      setFees(rawFees);
    }
    if ((!isBridgeButtonLoading && !trackingTxHash) || !limits) {
      setLimits(rawLimits);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawFees, rawLimits, trackingTxHash, isBridgeButtonLoading]);

  const setCurrentTokenExternal = (token: string) => {
    const routeAvailable = enabledRoutes.some(
      (route) =>
        (!currentFromRoute || route.fromChain === currentFromRoute) &&
        (!currentToRoute || route.toChain === currentToRoute) &&
        route.fromTokenSymbol === token
    );
    if (!routeAvailable) {
      const firstAvailableRoute = enabledRoutes.find(
        (route) => route.fromTokenSymbol === token
      );
      setCurrentFromRoute(firstAvailableRoute?.fromChain);
      setCurrentToRoute(firstAvailableRoute?.toChain);
    }
    setCurrentToken(token);
    trackTokenChanged(token);
  };

  const setCurrentFromRouteExternal = (chainId?: number) => {
    setCurrentFromRoute(chainId);
    if (chainId) {
      trackFromChainChanged(chainId, false);
    }
  };

  const setCurrentToRouteExternal = (chainId?: number) => {
    setCurrentToRoute(chainId);
    if (chainId) {
      trackToChainChanged(chainId, false);
    }
  };

  const isAmountGtMaxDeposit =
    !!limits && !!amountToBridge && amountToBridge.gt(limits.maxDeposit);

  return {
    ...bridgeAction,
    displayChangeAccount,
    setDisplayChangeAccount,
    setToAccount,
    toAccount,
    walletAccount: account,
    fees,
    limits,
    availableTokens,
    currentToken,
    setCurrentToken: setCurrentTokenExternal,
    setAmountToBridge,
    currentFromRoute,
    currentToRoute,
    setCurrentFromRoute: setCurrentFromRouteExternal,
    setCurrentToRoute: setCurrentToRouteExternal,
    currentBalance,
    availableFromRoutes,
    availableToRoutes,
    handleQuickSwap,
    isWrongChain: isWrongNetwork,
    handleChainSwitch: isWrongNetworkHandler,
    walletChainId,
    isConnected,
    isBridgeDisabled:
      isConnected &&
      (!isBridgeAmountValid ||
        isBridgeDisabled ||
        bridgeAction.buttonDisabled ||
        (!!fees && fees.isAmountTooLow) ||
        isAmountGtMaxDeposit),
    amountTooLow: isConnected && (fees?.isAmountTooLow ?? false),
    amountToBridge,
    estimatedTime,
    trackingTxHash,
    transactionPending,
    explorerUrl,
    onTxHashChange,
    transactionElapsedTimeAsFormattedString,
    disableQuickSwap,
    setIsBridgeAmountValid,
    allFromRoutes,
    allToRoutes,
    isAmountGtMaxDeposit,
  };
}
