export const FEATURE_FLAGS = [
  "demo-flag",
  "transaction-page",
  "popular-chains",
] as const;
export type FeatureFlag = (typeof FEATURE_FLAGS)[number];
