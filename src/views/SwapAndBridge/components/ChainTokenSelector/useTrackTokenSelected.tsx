import { useCallback } from "react";
import { ampli } from "../../../../ampli";
import { EnrichedToken } from "./ChainTokenSelectorModal";
import { useAmplitude } from "hooks/useAmplitude";

export function useTrackTokenSelected() {
  const { addToAmpliQueue } = useAmplitude();
  return useCallback(
    (token: EnrichedToken, isOriginToken: boolean) => {
      addToAmpliQueue(() => {
        if (isOriginToken) {
          ampli.originTokenSelected({
            action: "onClick",
            default: false,
            tokenAddress: token.address,
            tokenChainId: String(token.chainId),
            tokenSymbol: token.symbol,
          });
        } else {
          ampli.destinationTokenSelected({
            action: "onClick",
            default: false,
            tokenAddress: token.address,
            tokenChainId: String(token.chainId),
            tokenSymbol: token.symbol,
          });
        }
      });
    },
    [addToAmpliQueue]
  );
}
