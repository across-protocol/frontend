import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Header, Layout, Send } from "./components";

function App() {
  return (
    <Router>
      <Header />
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
