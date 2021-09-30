import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { ethers } from "ethers";
import { ERC20Ethers__factory } from "@uma/contracts-frontend";
import { PROVIDERS } from "../utils";
import { balances } from "./global";

type GetBalanceArgs = {
  account: string;
  chainId: number;
  tokens: string[];
};
const api = createApi({
  baseQuery: fakeBaseQuery(),
  endpoints: (build) => ({
    getBalances: build.query<ethers.BigNumber[], GetBalanceArgs>({
      queryFn: async ({ account, chainId, tokens }) => {
        try {
          const provider = PROVIDERS[chainId];
          const data = await Promise.all(
            tokens.map(async (token) => {
              // If its not ETH, we query like an ERC20
              if (token !== ethers.constants.AddressZero) {
                const contract = ERC20Ethers__factory.connect(token, provider);
                return contract.balanceOf(account);
              }

              return provider.getBalance(account);
            })
          );

          return { data };
        } catch (err) {
          return { error: err };
        }
      },
      onQueryStarted: async (
        { account, chainId, tokens },
        { dispatch, queryFulfilled }
      ) => {
        const { data } = await queryFulfilled;
        dispatch(
          balances({
            address: account,
            chainId,
            balances: tokens.reduce((acc, token, index) => {
              acc[token] = data[index];
              return acc;
            }, {} as Record<string, ethers.BigNumber>),
          })
        );
      },
    }),
    getETHBalance: build.query<
      ethers.BigNumber,
      Omit<GetBalanceArgs, "tokens">
    >({
      queryFn: async ({ account, chainId }) => {
        try {
          const provider = PROVIDERS[chainId];

          const data = await provider.getBalance(account);

          return { data };
        } catch (err) {
          return { error: err };
        }
      },
    }),
  }),
});

export const {
  useGetBalancesQuery: useBalances,
  useGetETHBalanceQuery: useETHBalance,
} = api;
export default api;
