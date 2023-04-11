import { useState, useEffect } from "react";
import { Types } from "@amplitude/analytics-browser";
import { createInstance } from "@amplitude/marketing-analytics-browser";

import { ampli } from "ampli";
import {
  amplitudeAPIKey,
  isAmplitudeLoggingEnabled,
  isProductionBuild,
} from "utils";

export function useLoadAmpli() {
  const [isAmpliLoaded, setIsAmpliLoaded] = useState(false);

  useEffect(() => {
    if (amplitudeAPIKey && !isAmpliLoaded) {
      const instance = createInstance();
      instance
        .init(amplitudeAPIKey, undefined, {
          disableCookies: true,
          logLevel:
            isProductionBuild || !isAmplitudeLoggingEnabled
              ? Types.LogLevel.Error
              : Types.LogLevel.Debug,
          trackingOptions: {
            ipAddress: false,
            carrier: false,
            city: false,
            region: false,
            dma: false, // designated market area
          },
        })
        .promise.then(
          () =>
            ampli.load({
              client: { instance },
            }).promise
        )
        .then(() => {
          setIsAmpliLoaded(true);
        });
    }
  }, [isAmpliLoaded]);

  return { isAmpliLoaded };
}
