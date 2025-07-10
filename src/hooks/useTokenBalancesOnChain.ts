import { ALCHEMY_API_KEY } from "utils/constants";
import { useConnection } from "./useConnection";
import { CHAIN_IDs, MAINNET_CHAIN_IDs } from "@across-protocol/constants";
import { useQueries } from "@tanstack/react-query";
import { BigNumber } from "ethers";

const CHAIN_TO_ALCHEMY = {
  [CHAIN_IDs.MAINNET]: "eth-mainnet",
  [CHAIN_IDs.OPTIMISM]: "opt-mainnet",
  [CHAIN_IDs.POLYGON]: "polygon-mainnet",
  [CHAIN_IDs.BASE]: "base-mainnet",
  [CHAIN_IDs.LINEA]: "linea-mainnet",
  [CHAIN_IDs.ARBITRUM]: "arb-mainnet",
};

const getAlchemyRpcUrl = (chainId: number) => {
  const chain = CHAIN_TO_ALCHEMY[chainId];
  return `https://${chain}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
};

export default function useTokenBalancesOnChain() {
  const { account } = useConnection();
  const chainIdsAvailable = Object.values(MAINNET_CHAIN_IDs)
    .sort((a, b) => a - b)
    .filter((chainId) => !!CHAIN_TO_ALCHEMY[chainId]);

  return useQueries({
    queries: chainIdsAvailable.map((chainId) => ({
      queryKey: ["tokenBalancesOnChain", chainId],
      enabled: account !== undefined,
      queryFn: async () => {
        const rpcUrl = getAlchemyRpcUrl(chainId);

        const balances = await fetch(rpcUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "alchemy_getTokenBalances",
            params: [account],
          }),
        });

        const data = await balances.json();

        return {
          chainId,
          balances: (
            data.result.tokenBalances as {
              contractAddress: string;
              tokenBalance: string;
            }[]
          )
            .filter((t) => !!t.tokenBalance && BigNumber.from(t.tokenBalance).gt(0))
            .map((t) => ({
              address: t.contractAddress,
              balance: BigNumber.from(t.tokenBalance),
            })),
        };
      },
    })),
  });
}
