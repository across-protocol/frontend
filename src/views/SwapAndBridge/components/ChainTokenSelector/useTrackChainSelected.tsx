import { useAmplitude } from "hooks/useAmplitude";
import { useCallback } from "react";
import { ampli } from "../../../../ampli";

export function useTrackChainSelected() {
  const { addToAmpliQueue } = useAmplitude();
  return useCallback(
    (chainId: number | null, isOriginToken: boolean) => {
      if (chainId === null) return;
      addToAmpliQueue(() => {
        if (isOriginToken) {
          ampli.originChainSelected({
            action: "onClick",
            chainId: String(chainId),
          });
        } else {
          ampli.destinationChainSelected({
            action: "onClick",
            chainId: String(chainId),
          });
        }
      });
    },
    [addToAmpliQueue]
  );
}
