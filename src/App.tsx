import React from "react";
import { Switch, BrowserRouter as Router, Route } from "react-router-dom";
import { Send, Pool, About, Confirmation } from "views";
import { Header } from "components";
import { useDeposits } from "state/hooks";

function App() {
  const { showConfirmationScreen } = useDeposits();
  return (
    <Router>
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
