import axios from "axios";
import { vercelApiBaseUrl } from "utils";

export type PoolsUserApiCall = typeof poolsUserApiCall;

export type PoolsUserQueryData = {
  address: string;
  poolAddress: string;
  lpTokens: string;
  positionValue: string;
  totalDeposited: string;
  feesEarned: string;
};

export async function poolsUserApiCall(
  l1Token: string,
  userAddress: string
): Promise<PoolsUserQueryData> {
  const response = await axios.get(`${vercelApiBaseUrl}/api/pools-user`, {
    params: {
      token: l1Token,
      user: userAddress,
    },
  });
  return response.data;
}
