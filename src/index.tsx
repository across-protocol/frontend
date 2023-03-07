import React from "react";
import ReactDOM from "react-dom";
import { GlobalStyles, ErrorBoundary } from "components";
import {
  QueryClientProvider,
  QueryClient,
  QueryCache,
  MutationCache,
} from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

import App from "./App";
import "./onboard-override.css";
import { ErrorProvider } from "hooks";
import { ToastProvider } from "components/Toast/useToast";
import { OnboardProvider } from "hooks/useOnboard";
import { enableReactQueryDevTools } from "utils";
import Sentry from "utils/sentry";

const client = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error("Query failed:", error);
      Sentry.captureException(error, (scope) => {
        scope.setContext("query", { queryHash: query.queryHash });
        return scope;
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, vars, context, mutation) => {
      console.error("Mutation failed:", error);
      Sentry.captureException(error, (scope) => {
        scope.setContext("mutation", {
          mutationId: mutation.mutationId,
          variables: mutation.state.variables,
        });
        return scope;
      });
    },
  }),
});

ReactDOM.render(
  <React.StrictMode>
    <GlobalStyles />
    <ErrorBoundary>
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
    </ErrorBoundary>
  </React.StrictMode>,
  document.getElementById("root")
);
