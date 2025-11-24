import { UserTokenBalancesResponse } from "../types";

/**
 * Mocked implementation of the user token balances API call
 * @param account The Ethereum address to query token balances for
 * @returns Mocked token balances data
 */
export async function userTokenBalancesMockedApiCall(
  account: string
): Promise<UserTokenBalancesResponse> {
  // Return mock data for testing/development
  return {
    account,
    balances: [
      {
        chainId: "1",
        balances: [
          {
            address: "0xA0b86a33E6441b8c4C8C0e4A0e4A0e4A0e4A0e4A0",
            balance: "1000000000000000000", // 1 ETH
          },
          {
            address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            balance: "1000000000", // 1000 USDT
          },
        ],
      },
      {
        chainId: "10",
        balances: [
          {
            address: "0x4200000000000000000000000000000000000006",
            balance: "500000000000000000", // 0.5 WETH
          },
        ],
      },
      {
        chainId: "137",
        balances: [
          {
            address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
            balance: "2000000000", // 2000 USDC
          },
        ],
      },
    ],
  };
}
