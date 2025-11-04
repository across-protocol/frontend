import { createContext, ReactNode, useContext } from "react";

import { amplitudeAPIKey } from "utils";

import { useLoadAmpli } from "./useLoadAmpli";
import { useInitialUserPropTraces } from "./useInitialUserPropTraces";
import { TrackingRequest, useAmpliTracking } from "./useAmpliTracking";

const isAmpliDisabled = Boolean(amplitudeAPIKey);

export const AmpliContext = createContext<{
  isAmpliLoaded: boolean;
  isAmpliDisabled: boolean;
  areInitialUserPropsSet: boolean;
  addToAmpliQueue: (request: TrackingRequest) => void;
}>({
  isAmpliLoaded: false,
  isAmpliDisabled,
  areInitialUserPropsSet: false,
  addToAmpliQueue: () => {},
});

export function AmpliProvider({ children }: { children: ReactNode }) {
  const { isAmpliLoaded } = useLoadAmpli();
  const { areInitialUserPropsSet } = useInitialUserPropTraces(isAmpliLoaded);
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
      }}
    >
      {children}
    </AmpliContext.Provider>
  );
}

export const useAmplitude = () => useContext(AmpliContext);
