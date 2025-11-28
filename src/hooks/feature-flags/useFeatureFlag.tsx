import { useContext } from "react";

import { FeatureFlag } from "./feature-flags";
import { FeatureFlagsContext } from "./featureFlagsContext";

export const useFeatureFlag = (featureFlag: FeatureFlag): boolean => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error("useFeatureFlag must be used within FeatureFlagsProvider");
  }
  return context.flags[featureFlag]?.value === "on";
};
