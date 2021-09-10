import React from "react";
import ReactDOM from "react-dom";

import App from "./App";
import { GlobalStyles } from "./components";
import { store } from "./app/store";
import { Provider } from "react-redux";

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <GlobalStyles />
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
