import { FC } from "react";
import { Switch, Route, useLocation } from "react-router-dom";
import { Send, Confirmation, Pool, About } from "views";
import { Header, SuperHeader } from "components";
import { useConnection, useDeposits, useSend } from "state/hooks";
import {
  DEFAULT_FROM_CHAIN_ID,
  DEFAULT_TO_CHAIN_ID,
  CHAINS,
  UnsupportedChainIdError,
  switchChain,
} from "utils";
import Footer from "components/Footer";

interface Props {}

// Need this component for useLocation hook
const Routes: FC<Props> = () => {
  const { fromChain } = useSend();
  const { showConfirmationScreen } = useDeposits();
  const { error, provider, chainId } = useConnection();
  const location = useLocation();
  const wrongNetworkSend =
    provider &&
    (error instanceof UnsupportedChainIdError || chainId !== fromChain);
  const wrongNetworkPool =
    provider &&
    (error instanceof UnsupportedChainIdError ||
      chainId !== DEFAULT_TO_CHAIN_ID);
  return (
    <>
      <Header />
      {wrongNetworkSend && location.pathname === "/" && (
        <SuperHeader>
          <div>
            You are on an incorrect network. Please{" "}
            <button onClick={() => switchChain(provider, fromChain)}>
              switch to {CHAINS[DEFAULT_FROM_CHAIN_ID].name}
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
      {/* visual bug with footer. hide it in pages that aren't /about */}
      {location.pathname === "/about" && <Footer />}
    </>
  );
};

export default Routes;
