import { BigNumber } from "ethers";
import {
  useBalanceBySymbol,
  useBridgeFees,
  useBridgeLimits,
  useConnection,
  useIsWrongNetwork,
} from "hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getChainInfo,
  getConfig,
  getConfirmationDepositTime,
  getToken,
} from "utils";
import { useBridgeAction } from "./useBridgeAction";

const enabledRoutes = getConfig().getRoutes();

export function useBridge() {
  // Get all available tokens from the enabled routes and use useMemo to avoid
  // recalculating this every time the component re-renders
  const availableTokens = useMemo(() => {
    // Map the enabled routes to an array of token symbols and filter for duplicates
    return enabledRoutes
      .map((route) => getToken(route.fromTokenSymbol))
      .filter(
        (token, index, self) =>
          index === self.findIndex((t) => t.symbol === token.symbol)
      );
  }, []);

  const [currentToken, setCurrentToken] = useState(availableTokens[0].symbol);
  const [amountToBridge, setAmountToBridge] = useState<BigNumber | undefined>(
    undefined
  );

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
  const [currentFromRoute, setCurrentFromRoute] = useState<number | undefined>(
    undefined
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
      if (currentToRoute) {
        const toRouteStillAvailable = availableRoutes.some(
          (route) => route.toChain === currentToRoute
        );
        if (!toRouteStillAvailable) {
          setCurrentToRoute(availableRoutes[0].toChain);
        }
      } else {
        setCurrentToRoute(availableRoutes[0].toChain);
      }
      if (currentFromRoute) {
        const fromRouteStillAvailable = availableRoutes.some(
          (route) => route.fromChain === currentFromRoute
        );
        if (!fromRouteStillAvailable) {
          setCurrentFromRoute(availableRoutes[0].fromChain);
        }
      } else {
        setCurrentFromRoute(availableRoutes[0].fromChain);
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
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableRoutes, currentToRoute]);

  // Create a function called handleQuickSwap which swaps the from chain and to chain
  // Use useCallback to avoid creating a new function every time the component re-renders
  const handleQuickSwap = useCallback(() => {
    if (currentFromRoute && currentToRoute) {
      // Resolve the from and to route as temporary variables
      const currentFromRouteTemp = currentFromRoute;
      const currentToRouteTemp = currentToRoute;
      // Set the current from route to the current to route
      setCurrentFromRoute(currentToRouteTemp);
      // Set the current to route to the current from route
      setCurrentToRoute(currentFromRouteTemp);
    }
  }, [currentFromRoute, currentToRoute]);

  const usersBalance = useBalanceBySymbol(currentToken, currentFromRoute);
  const currentBalance = usersBalance.balance;

  const { isWrongNetwork, isWrongNetworkHandler, checkWrongNetworkHandler } =
    useIsWrongNetwork(currentFromRoute);

  // Resolve the user's current chain id
  const { isConnected, chainId: walletChainId } = useConnection();

  // When a user changes the from route, ensure that they are on the same chain id
  // otherwise the user will be prompted to switch chains. Only do this for connected wallets
  useEffect(() => {
    checkWrongNetworkHandler();
  }, [currentFromRoute, isConnected, checkWrongNetworkHandler]);

  const bridgeAction = useBridgeAction();

  const isBridgeDisabled =
    isConnected && (!amountToBridge || amountToBridge.eq(0));

  // Resolve the fees by using the useBridgeFees hook
  const { fees } = useBridgeFees(
    amountToBridge ?? BigNumber.from(0),
    currentFromRoute,
    currentToRoute,
    currentToken
  );

  // Resolve the limits by using the useBridgeLimits hook
  const { limits } = useBridgeLimits(
    getToken(currentToken).mainnetAddress,
    currentFromRoute,
    currentToRoute
  );

  // Resolve the amount of time it takes to bridge
  const estimatedTime = useMemo(() => {
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
        : "loading..."
      : undefined;
  }, [amountToBridge, currentFromRoute, currentToRoute, limits]);

  return {
    ...bridgeAction,
    fees,
    limits,
    availableTokens,
    currentToken,
    setCurrentToken,
    setAmountToBridge,
    currentFromRoute,
    currentToRoute,
    setCurrentFromRoute,
    setCurrentToRoute,
    currentBalance,
    availableFromRoutes,
    availableToRoutes,
    handleQuickSwap,
    isWrongChain: isWrongNetwork,
    handleChainSwitch: isWrongNetworkHandler,
    walletChainId,
    isConnected,
    isBridgeDisabled,
    amountToBridge,
    estimatedTime,
  };
}
