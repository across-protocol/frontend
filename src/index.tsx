import React from "react";
import ReactDOM from "react-dom";
import { GlobalStyles, ErrorBoundary } from "components";
import {
  QueryClientProvider,
  QueryClient,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import App from "./App";
import "./onboard-override.css";
import { ErrorProvider } from "hooks";
import { ToastProvider } from "components/Toast/useToast";
import { OnboardProvider } from "hooks/useOnboard";
import { AmpliProvider } from "hooks/useAmplitude";
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

// eslint-disable-next-line react/no-deprecated
ReactDOM.render(
  <React.StrictMode>
    <GlobalStyles />
    <ErrorBoundary>
      <QueryClientProvider client={client}>
        <OnboardProvider>
          <AmpliProvider>
            <ErrorProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </ErrorProvider>
            {enableReactQueryDevTools && <ReactQueryDevtools />}
          </AmpliProvider>
        </OnboardProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
  document.getElementById("root")
);
