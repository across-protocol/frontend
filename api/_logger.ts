import * as sdk from "@across-protocol/sdk";

import { getEnvs } from "./_env";

const { VERCEL_ENV, LOG_LEVEL } = getEnvs();

type LoggingUtility = sdk.relayFeeCalculator.Logger;

export const LogLevels = {
  ERROR: 3,
  WARN: 2,
  INFO: 1,
  DEBUG: 0,
} as const;

// Singleton logger so we don't create multiple.
export let logger: LoggingUtility;

/**
 * Resolves a logging utility to be used. This instance caches its responses
 * @returns A valid Logging utility that can be used throughout the runtime
 */
export const getLogger = (): LoggingUtility => {
  if (!logger) {
    const defaultLogLevel = VERCEL_ENV === "production" ? "ERROR" : "DEBUG";

    let logLevel =
      LOG_LEVEL && Object.keys(LogLevels).includes(LOG_LEVEL)
        ? (LOG_LEVEL as keyof typeof LogLevels)
        : defaultLogLevel;

    logger = {
      debug: (...args) => {
        if (LogLevels[logLevel] <= LogLevels.DEBUG) {
          console.debug(args);
        }
      },
      info: (...args) => {
        if (LogLevels[logLevel] <= LogLevels.INFO) {
          console.info(args);
        }
      },
      warn: (...args) => {
        if (LogLevels[logLevel] <= LogLevels.WARN) {
          console.warn(args);
        }
      },
      error: (...args) => {
        if (LogLevels[logLevel] <= LogLevels.ERROR) {
          console.error(args);
        }
      },
    };
  }
  return logger;
};
