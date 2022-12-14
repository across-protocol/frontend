import { useQuery } from "react-query";
import { ethers } from "ethers";
import { ChainId, getRelayerFee } from "utils";
import { DateTime } from "luxon";

const FALLBACK_THRESHOLD_HOURS = 4;

export function useSuggestedRelayerFeePct(
  amount: ethers.BigNumber,
  fromChainId: ChainId,
  toChainId: ChainId,
  tokenSymbol: string,
  depositTime: number = DateTime.now().toSeconds()
) {
  const shouldUseFallbackFees =
    Math.abs(DateTime.fromSeconds(depositTime).diffNow().as("hours")) >
    FALLBACK_THRESHOLD_HOURS;
  return useQuery(
    getSuggestedRelayerFeePctQueryKey(
      amount,
      fromChainId,
      toChainId,
      tokenSymbol,
      depositTime
    ),
    async () => {
      if (shouldUseFallbackFees) {
        return ethers.utils.parseEther("0.0001"); // 1bp
      }

      const { relayerFee } = await getRelayerFee(
        tokenSymbol,
        amount,
        fromChainId,
        toChainId
      );
      return relayerFee.pct;
    },
    { staleTime: Infinity }
  );
}

function getSuggestedRelayerFeePctQueryKey(
  amount: ethers.BigNumber,
  fromChainId: ChainId,
  toChainId: ChainId,
  tokenSymbol: string,
  depositTime: number
) {
  return [
    "suggested-relayer-fee-pct",
    amount,
    fromChainId,
    toChainId,
    tokenSymbol,
    depositTime,
  ];
}
