import axios from "axios";
import { vercelApiBaseUrl } from "utils/constants";
import { UserTokenBalancesResponse } from "../types";

export type UserTokenBalancesCall = typeof userTokenBalancesApiCall;

/**
 * Creates an HTTP call to the `user-token-balances` API endpoint
 * @param account The Ethereum address to query token balances for
 * @returns The result of the HTTP call to `api/user-token-balances`
 */
export async function userTokenBalancesApiCall(
  account: string
): Promise<UserTokenBalancesResponse> {
  const response = await axios.get(
    `${vercelApiBaseUrl}/api/user-token-balances`,
    {
      params: {
        account,
      },
    }
  );

  return response.data;
}
