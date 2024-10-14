import { Logger } from "./sdk";

const { VERCEL_ENV, LOG_LEVEL } = process.env;

export const LogLevels = {
  ERROR: 3,
  WARN: 2,
  INFO: 1,
  DEBUG: 0,
} as const;
// Singleton logger so we don't create multiple.
let logger: Logger;

/**
 * Resolves a logging utility to be used. This instance caches its responses
 * @returns A valid Logging utility that can be used throughout the runtime
 */
export const getLogger = (): Logger => {
  if (!logger) {
    const defaultLogLevel = VERCEL_ENV === "production" ? "ERROR" : "DEBUG";

    let logLevel =
      LOG_LEVEL && !Object.keys(LogLevels).includes(LOG_LEVEL)
        ? defaultLogLevel
        : (LOG_LEVEL as keyof typeof LogLevels);

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
