import { useMemo } from "react";

import { CHAIN_IDs } from "utils/constants";
import { useFeatureFlagPayload } from "./feature-flags/useFeatureFlagPayload";

const DEFAULT_POPULAR_CHAINS = [
  CHAIN_IDs.MAINNET,
  CHAIN_IDs.BASE,
  CHAIN_IDs.UNICHAIN,
  CHAIN_IDs.ARBITRUM,
  CHAIN_IDs.SOLANA,
];

function isValidChainIdArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "number")
  );
}

export function usePopularChains(): number[] {
  const payload = useFeatureFlagPayload("popular-chains");

  return useMemo(() => {
    if (isValidChainIdArray(payload)) {
      return payload;
    }
    return DEFAULT_POPULAR_CHAINS;
  }, [payload]);
}
