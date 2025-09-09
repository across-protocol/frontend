import React from "react";
import { createRoot } from "react-dom/client";
import { GlobalStyles, ErrorBoundary } from "components";
import {
  QueryClientProvider,
  QueryClient,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import App from "./App";
import { ErrorProvider } from "hooks";
import { ToastProvider } from "components/Toast/useToast";
import { AmpliProvider } from "hooks/useAmplitude";
import { SidebarProvider } from "providers/SidebarProvider";
import { enableReactQueryDevTools } from "utils";
import Sentry from "utils/sentry";
import { WalletProvider } from "providers/wallet/WalletProvider";

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

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <GlobalStyles />
    <ErrorBoundary>
      <WalletProvider>
        <QueryClientProvider client={client}>
          <AmpliProvider>
            <ErrorProvider>
              <ToastProvider>
                <SidebarProvider>
                  <App />
                </SidebarProvider>
              </ToastProvider>
            </ErrorProvider>
            {enableReactQueryDevTools && <ReactQueryDevtools />}
          </AmpliProvider>
        </QueryClientProvider>
      </WalletProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
