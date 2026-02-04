import { useEffect, useState, useRef } from "react";
import * as amplitude from "@amplitude/analytics-browser";

import { ampli } from "ampli";
import {
  amplitudeAPIKey,
  amplitudeServerUrl,
  isAmplitudeLoggingEnabled,
  isProductionBuild,
} from "utils/constants";
import { useFeatureFlagsContext } from "./feature-flags/useFeatureFlagsContext";

let ampliInitialized = false;

export function useLoadAmpli() {
  const [isAmpliLoaded, setIsAmpliLoaded] = useState(ampliInitialized);
  const { initializeFeatureFlags } = useFeatureFlagsContext();
  const initializingRef = useRef(false);

  useEffect(() => {
    if (amplitudeAPIKey && !ampliInitialized && !initializingRef.current) {
      initializingRef.current = true;
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
        .then(() => {
          initializeFeatureFlags();
          ampliInitialized = true;
          setIsAmpliLoaded(true);
        });
    }
  }, [initializeFeatureFlags]);

  return { isAmpliLoaded };
}
