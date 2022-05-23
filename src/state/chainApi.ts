import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { ethers, BigNumber } from "ethers";
import { getProvider, ChainId, getConfig } from "utils";

import { clients } from "@uma/sdk";
import { ERC20Ethers__factory } from "@uma/contracts-frontend";

type BalancesQueryArgs = {
  account: string;
  chainId: ChainId;
};

type AllowanceQueryArgs = {
  owner: string;
  spender: string;
  chainId: ChainId;
  token: string;
  amount: ethers.BigNumber;
};

const api = createApi({
  baseQuery: fakeBaseQuery(),
  endpoints: (build) => ({
    balances: build.query<ethers.BigNumber[], BalancesQueryArgs>({
      queryFn: async ({ account, chainId }) => {
        try {
          const provider = getProvider(chainId);
          const config = getConfig();
          const tokenList = config.getTokenList(chainId);
          const balances = await Promise.all(
            tokenList.map(async (token) => {
              try {
                // If it is ETH, use getBalance from the provider
                if (token.isNative) {
                  return provider.getBalance(account);
                }
                const contract = ERC20Ethers__factory.connect(
                  token.address,
                  provider
                );
                return await contract.balanceOf(account);
              } catch (err) {
                console.error(
                  `Error fetching balance for: ${token.name} at ${token.address}`
                );
                console.error(err);
                return BigNumber.from("0");
              }
            })
          );
          return { data: balances };
        } catch (error) {
          return { error };
        }
      },
    }),
    allowance: build.query<
      { hasToApprove: boolean; allowance: ethers.BigNumber },
      AllowanceQueryArgs
    >({
      queryFn: async ({ owner, spender, chainId, token, amount }) => {
        try {
          const provider = getProvider(chainId);
          // For ETH, allowance does not make sense
          if (token === ethers.constants.AddressZero) {
            return {
              data: {
                hasToApprove: false,
                allowance: ethers.constants.MaxUint256,
              },
            };
          }
          const contract = clients.erc20.connect(token, provider);
          const allowance = await contract.allowance(owner, spender);
          const hasToApprove = amount.gt(allowance);

          return { data: { allowance, hasToApprove } };
        } catch (error) {
          return { error };
        }
      },
    }),
    ethBalance: build.query<ethers.BigNumber, BalancesQueryArgs>({
      queryFn: async ({ account, chainId }) => {
        try {
          const provider = getProvider(chainId);
          const balance = await provider.getBalance(account);
          return { data: balance };
        } catch (error) {
          return { error };
        }
      },
    }),
  }),
});

export const {
  useBalancesQuery: useBalances,
  useEthBalanceQuery: useETHBalance,
  useAllowanceQuery: useAllowance,
} = api;
export default api;
