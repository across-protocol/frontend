import { ReactNode, useCallback, useRef, useState } from "react";
import {
  Experiment,
  ExperimentClient,
  Variants,
} from "@amplitude/experiment-js-client";
import { FEATURE_FLAGS } from "./feature-flags";
import { FeatureFlagsContext } from "./featureFlagsContext";

const publicDeploymentKey = "client-jAXxBGw14klnGdfOPcGCrIpbvpvBXZqL";

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Variants>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const experimentClientRef = useRef<ExperimentClient | null>(null);

  const initializeExperiment = useCallback(() => {
    if (experimentClientRef.current) {
      console.warn("Experiment client already initialized");
      return;
    }
    experimentClientRef.current = Experiment.initializeWithAmplitudeAnalytics(
      publicDeploymentKey,
      {}
    );
    // set flags from localstorage before a fetch is initialized
    setFlags(experimentClientRef.current.all());
    setIsInitialized(true);
  }, []);

  const fetchFlags = useCallback(async () => {
    if (!experimentClientRef.current) {
      console.error(
        "Experiment client not initialized. Call initializeExperiment() first."
      );
      return;
    }

    try {
      setIsLoading(true);
      await experimentClientRef.current.fetch(undefined, {
        flagKeys: [...FEATURE_FLAGS],
      });
      setFlags(experimentClientRef.current.all());
    } catch (error) {
      console.error("Failed to fetch feature flags:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <FeatureFlagsContext.Provider
      value={{
        flags,
        isLoading,
        isInitialized,
        initializeExperiment,
        fetchFlags,
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
}
