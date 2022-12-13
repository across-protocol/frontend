import { AmplitudeEventLogger } from "./event-logger";

// Singleton
let amplitudeLoggerSingleton: AmplitudeEventLogger | undefined = undefined;
export function getAmplitudeLogger(): AmplitudeEventLogger {
  if (!amplitudeLoggerSingleton) {
    amplitudeLoggerSingleton = new AmplitudeEventLogger();
  }
  return amplitudeLoggerSingleton;
}
