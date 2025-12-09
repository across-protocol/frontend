export const FEATURE_FLAGS = ["demo-flag"] as const;
export type FeatureFlag = (typeof FEATURE_FLAGS)[number];
