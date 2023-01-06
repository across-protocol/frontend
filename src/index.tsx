import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { store } from "state";
import { GlobalStyles } from "components";
import { QueryClientProvider, QueryClient } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

import App from "./App";
import "./onboard-override.css";
import { ErrorProvider } from "hooks";
import { ToastProvider } from "components/Toast/useToast";
import { OnboardProvider } from "hooks/useOnboard";
import { enableReactQueryDevTools } from "utils";

const client = new QueryClient();

ReactDOM.render(
  <React.StrictMode>
    <GlobalStyles />
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <OnboardProvider>
          <ErrorProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </ErrorProvider>
          {enableReactQueryDevTools && <ReactQueryDevtools />}
        </OnboardProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
