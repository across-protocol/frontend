import { useState, useEffect } from "react";
import * as amplitude from "@amplitude/analytics-browser";

import { ampli } from "ampli";
import {
  amplitudeAPIKey,
  isAmplitudeLoggingEnabled,
  isProductionBuild,
  amplitudeServerUrl,
} from "utils";

export function useLoadAmpli() {
  const [isAmpliLoaded, setIsAmpliLoaded] = useState(false);

  useEffect(() => {
    if (amplitudeAPIKey && !isAmpliLoaded && false) {
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
            sessions: false,
            fileDownloads: false,
            formInteractions: false,
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
