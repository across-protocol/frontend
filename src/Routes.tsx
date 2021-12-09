import { FC } from "react";
import { Switch, Route, useLocation } from "react-router-dom";
import { Send, Confirmation, Pool, About } from "views";
import { Header, SuperHeader } from "components";
import { useConnection, useDeposits } from "state/hooks";
import {
  DEFAULT_TO_CHAIN_ID,
  CHAINS,
  UnsupportedChainIdError,
  switchChain,
} from "utils";

import { useAppSelector } from "state/hooks";

interface Props {}

// Need this component for useLocation hook
const Routes: FC<Props> = () => {
  const { showConfirmationScreen } = useDeposits();
  const { error, provider, chainId } = useConnection();
  const location = useLocation();
  const sendState = useAppSelector((state) => state.send);

  const wrongNetworkSend =
    provider &&
    chainId &&
    (error instanceof UnsupportedChainIdError ||
      chainId !== sendState.currentlySelectedFromChain.chainId);
  const wrongNetworkPool =
    provider &&
    (error instanceof UnsupportedChainIdError ||
      chainId !== DEFAULT_TO_CHAIN_ID);

  return (
    <>
      {wrongNetworkSend && location.pathname === "/" && (
        <SuperHeader>
          <div>
            You are on an incorrect network. Please{" "}
            <button
              onClick={() =>
                switchChain(
                  provider,
                  sendState.currentlySelectedFromChain.chainId
                )
              }
            >
              switch to{" "}
              {CHAINS[sendState.currentlySelectedFromChain.chainId].name}
            </button>
          </div>
        </SuperHeader>
      )}
      {wrongNetworkPool && location.pathname === "/pool" && (
        <SuperHeader>
          <div>
            You are on an incorrect network. Please{" "}
            <button onClick={() => switchChain(provider, DEFAULT_TO_CHAIN_ID)}>
              switch to {CHAINS[DEFAULT_TO_CHAIN_ID].name}
            </button>
          </div>
        </SuperHeader>
      )}
      <Header />
      <Switch>
        {!process.env.REACT_APP_HIDE_POOL ? (
          <Route exact path="/pool" component={Pool} />
        ) : null}

        <Route exact path="/about" component={About} />
        <Route
          exact
          path="/"
          component={showConfirmationScreen ? Confirmation : Send}
        />
      </Switch>
    </>
  );
};

export default Routes;
