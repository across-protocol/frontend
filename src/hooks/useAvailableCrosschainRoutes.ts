import { MAINNET_CHAIN_IDs } from "@across-protocol/constants";
import { useQuery } from "@tanstack/react-query";

export type LifiToken = {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  priceUSD: string;
  coinKey: string;
  logoURI: string;
};

// TODO: Currently stubbed and will need to be added to the swap API
export default function useAvailableCrosschainRoutes() {
  return useQuery({
    queryKey: ["availableCrosschainRoutes"],
    queryFn: async () => {
      const result = await fetch(
        "https://li.quest/v1/tokens?chainTypes=EVM&minPriceUSD=0.001"
      );
      const data = (await result.json()) as {
        tokens: Record<string, Array<LifiToken>>;
      };

      return Object.entries(data.tokens).reduce(
        (acc, [chainId, tokens]) => {
          if (Object.values(MAINNET_CHAIN_IDs).includes(Number(chainId))) {
            acc[Number(chainId)] = tokens;
          }
          return acc;
        },
        {} as Record<number, Array<LifiToken>>
      );
    },
  });
}
