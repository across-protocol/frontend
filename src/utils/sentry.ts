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
    // ignore MetaMask errors we don't control
    ignoreErrors: [
      "Internal JSON-RPC error",
      "JsonRpcEngine",
      "Non-Error promise rejection captured with keys: code",
    ],
  });
}

export default Sentry;
