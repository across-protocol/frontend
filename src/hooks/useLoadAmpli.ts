import { useEffect, useState } from "react";
import * as amplitude from "@amplitude/analytics-browser";

import { ampli } from "ampli";
import {
  amplitudeAPIKey,
  amplitudeServerUrl,
  isAmplitudeLoggingEnabled,
  isProductionBuild,
} from "utils";
import { initializeExperiment } from "./useInitializeFeatureFlags";

export function useLoadAmpli() {
  const [isAmpliLoaded, setIsAmpliLoaded] = useState(false);

  useEffect(() => {
    if (amplitudeAPIKey && !isAmpliLoaded) {
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
        .then(() => initializeExperiment())
        .then(() => {
          setIsAmpliLoaded(true);
        });
    }
  }, [isAmpliLoaded]);

  return { isAmpliLoaded };
}
