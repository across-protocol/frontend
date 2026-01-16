import * as Sentry from "@sentry/react";
import {
  sentryEnv,
  sentryDsn,
  isSentryEnabled,
  currentGitCommitHash,
} from "./constants";

if (isSentryEnabled) {
  Sentry.init({
    environment: sentryEnv || "development",
    dsn: sentryDsn,
    release: currentGitCommitHash,

    ignoreErrors: [
      "Internal JSON-RPC error",
      "JsonRpcEngine",
      "Non-Error promise rejection captured with keys: code",
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
  if (!isSentryEnabled) return;

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
  if (!isSentryEnabled) return;

  Sentry.setContext("chain", {
    chainId,
  });
};

export default Sentry;
