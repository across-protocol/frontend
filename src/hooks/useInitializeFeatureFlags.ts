import { useEffect, useState } from "react";
import {
  Experiment,
  ExperimentClient,
  Variants,
} from "@amplitude/experiment-js-client";

const flags = ["demo-flag"] as const;
export type FeatureFlag = (typeof flags)[number];
const publicDeploymentKey = "client-jAXxBGw14klnGdfOPcGCrIpbvpvBXZqL";

let experimentClient: ExperimentClient | null = null;
let updateSubscribers: (() => void)[] = [];

const getExperimentClient = (): ExperimentClient => {
  if (!experimentClient) {
    throw new Error(
      "Experiment client not initialized. Call initializeExperiment() first."
    );
  }
  return experimentClient;
};

export const initializeExperiment = () => {
  if (experimentClient) {
    console.warn("Experiment client already initialized");
    return;
  }
  experimentClient = Experiment.initializeWithAmplitudeAnalytics(
    publicDeploymentKey,
    {}
  );
};

const notifySubscribers = () => {
  updateSubscribers.forEach((callback) => callback());
};

export const subscribeToFeatureFlags = (callback: () => void): (() => void) => {
  updateSubscribers.push(callback);
  return () => {
    updateSubscribers = updateSubscribers.filter((cb) => cb !== callback);
  };
};

export const getFeatureFlagValue = (featureFlag: FeatureFlag): boolean => {
  try {
    const client = getExperimentClient();
    return client.variant(featureFlag).value === "on";
  } catch {
    // Not initialized yet, return false
    return false;
  }
};

export const fetchFeatureFlags = async () => {
  const client = getExperimentClient();
  await client.fetch(undefined, { flagKeys: [...flags] });
  notifySubscribers();
  return client.all();
};

// React hook that subscribes to feature flag updates and triggers re-renders
export const useFeatureFlag = (featureFlag: FeatureFlag): boolean => {
  const [flagValue, setFlagValue] = useState(() =>
    getFeatureFlagValue(featureFlag)
  );

  useEffect(() => {
    const unsubscribe = subscribeToFeatureFlags(() => {
      setFlagValue(getFeatureFlagValue(featureFlag));
    });
    return unsubscribe;
  }, [featureFlag]);

  return flagValue;
};
