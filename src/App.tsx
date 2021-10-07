import React from "react";

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Header, Wallet } from "./components";
import { Send, Pool, About } from "views";
import { useOnboard } from "hooks";
import { useConnection, useETHBalance } from "state/hooks";
import { formatEther } from "utils";

function App() {
  const { account, chainId } = useConnection();
  const { init } = useOnboard();
  const { data: balance } = useETHBalance(
    { account: account ?? "", chainId: chainId ?? 1 },
    { skip: !account && !chainId }
  );

  return (
    <Router>
      <Header>
        <Wallet
          account={account}
          balance={formatEther(balance ?? 0)}
          chainId={chainId}
          onWalletConnect={init}
        />
      </Header>

      <Switch>
        <Route exact path="/" component={Send} />
        <Route path="/pool" component={Pool} />
        <Route path="/about" component={About} />
      </Switch>
    </Router>
  );
}

export default App;
