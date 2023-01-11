import React from "react";
import ReactDOM from "react-dom";
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
  </React.StrictMode>,
  document.getElementById("root")
);
