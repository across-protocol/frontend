import { createContext } from "react";
import { Variants } from "@amplitude/experiment-js-client";

interface FeatureFlagsContextValue {
  flags: Variants;
  isLoading: boolean;
  isInitialized: boolean;
  initializeExperiment: () => void;
  fetchFlags: () => Promise<void>;
}

export const FeatureFlagsContext =
  createContext<FeatureFlagsContextValue | null>(null);
