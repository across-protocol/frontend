import * as amplitude from "@amplitude/analytics-browser";
import { amplitudeAPIKey } from "utils/constants";
import { AmplitudeEventLogRecord } from "./types";

/**
 * A common abstraction to logging via Amplitude
 */
export class AmplitudeEventLogger {
  /**
   * A singleton instance of the AmplitudeEventLogger
   */
  private static sharedLogger: AmplitudeEventLogger | undefined = undefined;

  /**
   * Resolves a singleton instance of the AmplitudeEventLogger
   * @returns A singleton instance of the AmplitudeEventLogger
   */
  public static shared(): AmplitudeEventLogger {
    if (!AmplitudeEventLogger.sharedLogger) {
      AmplitudeEventLogger.sharedLogger = new AmplitudeEventLogger();
    }
    return AmplitudeEventLogger.sharedLogger;
  }

  private constructor() {
    this.initAmplitude();
  }
  /**
   * Determines if amplitude logging is enabled.
   * @returns A truthy value if amplitude is enabled.
   */
  public isAmplitudeEnabled() {
    return Boolean(amplitudeAPIKey);
  }
  /**
   * Initializes amplitude. Do not call more than once.
   */
  private initAmplitude() {
    if (this.isAmplitudeEnabled()) amplitude.init(amplitudeAPIKey!);
  }

  /**
   * Submits a record to amplitude for logging.
   * @param event A record to be uploaded to amplitude
   */
  public recordEvent(event: AmplitudeEventLogRecord): void {
    if (this.isAmplitudeEnabled()) amplitude.track(event.event, event.payload);
  }
}
