import React from "react";
import { Switch, BrowserRouter as Router, Route } from "react-router-dom";
import { Send, Pool, About, Confirmation } from "views";
import { Header, SuperHeader } from "components";
import { useConnection, useDeposits, useSend } from "state/hooks";
import {
  DEFAULT_FROM_CHAIN_ID,
  CHAINS,
  UnsupportedChainIdError,
  switchChain,
} from "utils";

function App() {
  const { fromChain } = useSend();
  const { showConfirmationScreen } = useDeposits();
  const { error, provider, chainId } = useConnection();

  const wrongNetwork =
    provider &&
    (error instanceof UnsupportedChainIdError || chainId !== fromChain);
  return (
    <Router>
      {wrongNetwork && (
        <SuperHeader>
          <div>
            You are on the wrong network. Please{" "}
            <button onClick={() => switchChain(provider, fromChain)}>
              switch to {CHAINS[DEFAULT_FROM_CHAIN_ID].name}
            </button>
          </div>
        </SuperHeader>
      )}
      <Header />
      <Switch>
        <Route
          exact
          path="/"
          component={showConfirmationScreen ? Confirmation : Send}
        />
        <Route path="/pool" component={Pool} />
        <Route path="/about" component={About} />
      </Switch>
    </Router>
  );
}
export default App;
