import { useConnection } from "./useConnection";
import { useQuery } from "@tanstack/react-query";
import { BigNumber } from "ethers";

type TokenBalance = {
  address: string;
  balance: BigNumber;
};

type ChainBalances = {
  chainId: number;
  balances: TokenBalance[];
};

type UserTokenBalancesResponse = {
  account: string;
  balances: Array<{
    chainId: string;
    balances: Array<{
      address: string;
      balance: string;
    }>;
  }>;
};

export default function useTokenBalancesOnChain() {
  const { account } = useConnection();

  return useQuery({
    queryKey: ["userTokenBalances", account],
    queryFn: async (): Promise<ChainBalances[]> => {
      const response = await fetch(
        `/api/user-token-balances?account=${account}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch token balances: ${response.statusText}`
        );
      }

      const data: UserTokenBalancesResponse = await response.json();

      // Convert string balances back to BigNumber and transform the response
      return data.balances.map(({ chainId, balances }) => ({
        chainId: Number(chainId),
        balances: balances.map(({ address, balance }) => ({
          address,
          balance: BigNumber.from(balance ?? "0"),
        })),
      }));
    },
    enabled: !!account,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 3 * 60 * 1000, // Consider data stale after 3 minutes
  });
}
