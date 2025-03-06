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
import { WagmiProvider } from "wagmi";

import App from "./App";
import "./onboard-override.css";
import { ErrorProvider } from "hooks";
import { ToastProvider } from "components/Toast/useToast";
import { AmpliProvider } from "hooks/useAmplitude";
import { SidebarProvider } from "providers/SidebarProvider";
import { enableReactQueryDevTools } from "utils";
import Sentry from "utils/sentry";
import { wagmiConfig } from "wagmi.config";

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
      <WagmiProvider config={wagmiConfig}>
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
      </WagmiProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
