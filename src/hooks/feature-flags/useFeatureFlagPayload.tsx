import { useContext } from "react";

import { FeatureFlag } from "./feature-flags";
import { FeatureFlagsContext } from "./featureFlagsContext";

export const useFeatureFlagPayload = (
  featureFlag: FeatureFlag
): unknown | undefined => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error(
      "useFeatureFlagPayload must be used within FeatureFlagsProvider"
    );
  }
  const variant = context.flags[featureFlag];
  if (variant?.value === "on") {
    return variant.payload;
  }
  return undefined;
};
