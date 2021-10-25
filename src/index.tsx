import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { store } from "state";
import { GlobalStyles, BlockPoller } from "components";

import App from "./App";

ReactDOM.render(
  <React.StrictMode>
    <GlobalStyles />
    <Provider store={store}>
      <BlockPoller />
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
