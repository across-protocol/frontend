import { getTokenByAddress } from "utils/constants";
import { PoolsUserQueryData } from "../prod/pools-user";
import { parseUnits } from "utils/format";

export async function poolsUserApiCall(
  l1Token: string,
  userAddress: string
): Promise<PoolsUserQueryData> {
  const token = getTokenByAddress(l1Token);
  const decimals = token?.decimals ?? 18;

  return {
    address: userAddress,
    poolAddress: l1Token,
    lpTokens: parseUnits("10", decimals).toString(),
    positionValue: parseUnits("10", decimals).toString(),
    totalDeposited: parseUnits("10", decimals).toString(),
    feesEarned: parseUnits("0.1", decimals).toString(),
  };
}
