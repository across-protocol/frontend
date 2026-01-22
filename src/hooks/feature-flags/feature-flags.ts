export const FEATURE_FLAGS = ["demo-flag", "transaction-page"] as const;
export type FeatureFlag = (typeof FEATURE_FLAGS)[number];
