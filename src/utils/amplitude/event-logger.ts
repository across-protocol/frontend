import * as amplitude from "@amplitude/analytics-browser";
import { amplitudeAPIKey } from "utils/constants";

/**
 * A common abstraction to logging via Amplitude
 */
export class AmplitudeEventLogger {
  constructor() {
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
}
