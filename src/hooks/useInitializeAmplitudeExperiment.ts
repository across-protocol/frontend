import { useState } from "react";
import { Experiment, ExperimentClient } from "@amplitude/experiment-js-client";
import { ampli } from "../ampli";

const flags = ["demo-flag"] as const;
export type FeatureFlag = (typeof flags)[number];

export const useInitializeAmplitudeExperiment = () => {
  const [experimentClient, setExperimentClient] = useState<ExperimentClient>();

  const initializeExperiment = () => {
    const deploymentKey = "client-jAXxBGw14klnGdfOPcGCrIpbvpvBXZqL";
    const experiment = Experiment.initializeWithAmplitudeAnalytics(
      deploymentKey,
      {}
    );
    setExperimentClient(experiment);
    // Don't fetch here - wait until userId is set in useInitialUserPropTraces
  };

  const hasFeatureFlag: (featureFlag: FeatureFlag) => boolean = (
    featureFlag: FeatureFlag
  ) => {
    if (experimentClient) {
      const variant = experimentClient.variant(featureFlag);
      console.log(featureFlag, variant, ampli.client.getUserId());
      return variant.value === "on";
    }
    return false;
  };

  const fetchFeatureFlags = () => {
    return experimentClient?.fetch(undefined, { flagKeys: [...flags] });
  };

  return {
    hasFeatureFlag,
    initializeExperiment,
    fetchFeatureFlags,
  };
};
