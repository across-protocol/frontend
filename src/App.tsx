import React from "react";

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Header, Layout, Send, Wallet } from "./components";
import { useOnboard } from "./hooks";
import { useConnection, useETHBalance } from "./state/hooks";
import { formatEther } from "./utils";

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
      <Layout>
        <Switch>
          <Route exact path="/" component={Send} />
          <Route path="/pool" component={Send} />
          <Route path="/about" component={Send} />
        </Switch>
      </Layout>
    </Router>
  );
}

export default App;
