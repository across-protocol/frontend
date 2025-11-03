import { createContext, ReactNode, useContext } from "react";

import { amplitudeAPIKey } from "utils";

import { useLoadAmpli } from "./useLoadAmpli";
import { useInitialUserPropTraces } from "./useInitialUserPropTraces";
import { TrackingRequest, useAmpliTracking } from "./useAmpliTracking";
import { FeatureFlag } from "./useInitializeAmplitudeExperiment";

const isAmpliDisabled = Boolean(amplitudeAPIKey);

export const AmpliContext = createContext<{
  isAmpliLoaded: boolean;
  isAmpliDisabled: boolean;
  areInitialUserPropsSet: boolean;
  addToAmpliQueue: (request: TrackingRequest) => void;
  hasFeatureFlag: (featureFlag: FeatureFlag) => boolean;
  fetchFeatureFlags: () => void;
}>({
  isAmpliLoaded: false,
  isAmpliDisabled,
  areInitialUserPropsSet: false,
  addToAmpliQueue: () => {},
  hasFeatureFlag: () => false,
  fetchFeatureFlags: () => {},
});

export function AmpliProvider({ children }: { children: ReactNode }) {
  const { fetchFeatureFlags, isAmpliLoaded, hasFeatureFlag } = useLoadAmpli();
  const { areInitialUserPropsSet } = useInitialUserPropTraces(
    isAmpliLoaded,
    fetchFeatureFlags
  );
  const { addToQueue: addToAmpliQueue } = useAmpliTracking(
    areInitialUserPropsSet
  );

  return (
    <AmpliContext.Provider
      value={{
        isAmpliLoaded,
        isAmpliDisabled,
        areInitialUserPropsSet,
        addToAmpliQueue,
        hasFeatureFlag,
        fetchFeatureFlags,
      }}
    >
      {children}
    </AmpliContext.Provider>
  );
}

export const useAmplitude = () => useContext(AmpliContext);

export const useFeatureFlag = () => {
  const { fetchFeatureFlags, hasFeatureFlag } = useAmplitude();
  return {
    hasFeatureFlag: (featureFlag: FeatureFlag) => hasFeatureFlag(featureFlag),
    fetchFeatureFlags: () => fetchFeatureFlags(),
  };
};
