import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { ethers, BigNumber } from "ethers";
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
  blockTime: number;
};

type BridgeFeesQueryResult = BridgeFees & {
  isAmountTooLow: boolean;
  isLiquidityInsufficient: boolean;
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
              try {
                // If it is ETH, use getBalance from the provider
                if (token.address === ethers.constants.AddressZero) {
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
      queryFn: async ({ amount, tokenSymbol, blockTime }) => {
        try {
          const { instantRelayFee, slowRelayFee, isAmountTooLow } =
            await getRelayFees(tokenSymbol, amount);

          const { isLiquidityInsufficient, ...lpFee } = await getLpFee(
            tokenSymbol,
            amount,
            blockTime
          );

          return {
            data: {
              instantRelayFee,
              slowRelayFee,
              lpFee,
              isAmountTooLow,
              isLiquidityInsufficient,
            },
          };
        } catch (error) {
          console.error("bridge fee calculation failed");
          console.error(error);
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
