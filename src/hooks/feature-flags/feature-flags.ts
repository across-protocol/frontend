export const FEATURE_FLAGS = [
  "demo-flag",
  "transaction-page",
  "polymarket-banner",
] as const;
export type FeatureFlag = (typeof FEATURE_FLAGS)[number];
