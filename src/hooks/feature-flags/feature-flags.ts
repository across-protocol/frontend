export const FEATURE_FLAGS = [
  "demo-flag",
  "transaction-page",
  "api-gas-params",
] as const;
export type FeatureFlag = (typeof FEATURE_FLAGS)[number];
