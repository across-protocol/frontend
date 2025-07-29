import { useState, useEffect } from "react";
import * as amplitude from "@amplitude/analytics-browser";

import { ampli } from "ampli";
import {
  amplitudeAPIKey,
  isAmplitudeLoggingEnabled,
  isProductionBuild,
  amplitudeServerUrl,
} from "utils";
import { sessionReplayPlugin } from "@amplitude/plugin-session-replay-browser";

export function useLoadAmpli() {
  const [isAmpliLoaded, setIsAmpliLoaded] = useState(false);

  useEffect(() => {
    if (amplitudeAPIKey && !isAmpliLoaded) {
      const sessionReplayTracking = sessionReplayPlugin();
      amplitude.add(sessionReplayTracking);

      amplitude
        .init(amplitudeAPIKey, undefined, {
          serverUrl: amplitudeServerUrl,
          identityStorage: "none",
          logLevel:
            isProductionBuild || !isAmplitudeLoggingEnabled
              ? amplitude.Types.LogLevel.Error
              : amplitude.Types.LogLevel.Debug,
          defaultTracking: {
            attribution: true,
            pageViews: false,
            sessions: true,
            fileDownloads: false,
            formInteractions: false,
          },
          trackingOptions: {
            ipAddress: false,
          },
        })
        .promise.then(
          () =>
            ampli.load({
              client: { instance: amplitude },
            }).promise
        )
        .then(() => {
          setIsAmpliLoaded(true);
        });
    }
  }, [isAmpliLoaded]);

  return { isAmpliLoaded };
}
