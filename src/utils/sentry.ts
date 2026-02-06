import * as Sentry from "@sentry/react";
import {
  sentryEnv,
  sentryDsn,
  isSentryEnabled,
  isProductionBuild,
  currentGitCommitHash,
} from "./constants";

if (isSentryEnabled && isProductionBuild) {
  Sentry.init({
    environment: sentryEnv || "development",
    dsn: sentryDsn,
    release: currentGitCommitHash,

    ignoreErrors: [
      "Internal JSON-RPC error",
      "JsonRpcEngine",
      "Non-Error promise rejection captured with keys: code",
      /user rejected/i,
      /user denied/i,
      /user disapproved/i,
      /rejected the request/i,
      /transaction canceled/i,
      /request expired/i,
      /proposal expired/i,
      /approval denied/i,
    ],

    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
    ],

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    tracesSampleRate: sentryEnv === "production" ? 0.1 : 1.0,

    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 0.01,
  });
}

export const setUserContext = (address: string | null) => {
  if (!isSentryEnabled || !isProductionBuild) return;

  if (address) {
    Sentry.setUser({
      id: address.toLowerCase(),
      walletAddress: address,
    });
  } else {
    Sentry.setUser(null);
  }
};

export const setChainContext = (chainId: number | undefined) => {
  if (!isSentryEnabled || !isProductionBuild) return;

  Sentry.setContext("chain", {
    chainId,
  });
};

export default Sentry;
