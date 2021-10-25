import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { ethers } from "ethers";
import { PROVIDERS, getRelayFees, ChainId, TOKENS_LIST, getLpFee } from "utils";
import type { BridgeFees } from "utils";

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

type BridgeFeesQueryArgs = {
  amount: ethers.BigNumber;
  tokenSymbol: string;
  blockNumber: number;
};

type BridgeFeesQueryResult = BridgeFees & {
  isAmountTooLow: boolean;
};

const api = createApi({
  baseQuery: fakeBaseQuery(),
  endpoints: (build) => ({
    balances: build.query<ethers.BigNumber[], BalancesQueryArgs>({
      queryFn: async ({ account, chainId }) => {
        try {
          const provider = PROVIDERS[chainId]();
          const balances = await Promise.all(
            TOKENS_LIST[chainId].map(async (token) => {
              // If it is ETH, use getBalance from the provider
              if (token.symbol === "ETH") {
                return provider.getBalance(account);
              }
              const contract = ERC20Ethers__factory.connect(
                token.address,
                provider
              );
              const balance = await contract.balanceOf(account);

              console.log({ balance, token, contract });
              return balance;
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
          const provider = PROVIDERS[chainId]();
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
          const provider = PROVIDERS[chainId]();
          const balance = await provider.getBalance(account);
          return { data: balance };
        } catch (error) {
          return { error };
        }
      },
    }),
    bridgeFees: build.query<BridgeFeesQueryResult, BridgeFeesQueryArgs>({
      // We want to re-run the fee query on each block change
      queryFn: async ({ amount, tokenSymbol, blockNumber }) => {
        try {
          const { instantRelayFee, slowRelayFee, isAmountTooLow } =
            await getRelayFees(tokenSymbol, amount);
          const lpFee = await getLpFee(tokenSymbol, amount);
          // const lpFee = {
          //   total: ethers.constants.Zero,
          //   pct: ethers.constants.Zero,
          // };
          console.log({ instantRelayFee, slowRelayFee, lpFee, blockNumber });
          return {
            data: { instantRelayFee, slowRelayFee, lpFee, isAmountTooLow },
          };
        } catch (error) {
          console.log("bridge fee calculation failed");
          console.log(error);
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
  useBridgeFeesQuery: useBridgeFees,
} = api;
export default api;
