import { PoolsUserQueryData } from "../prod/pools-user";
import { parseUnits } from "../../format";
import { getConfig } from "../../config";
import { hubPoolChainId } from "../../constants";

export async function poolsUserApiCall(
  l1Token: string,
  userAddress: string
): Promise<PoolsUserQueryData> {
  const config = getConfig();
  const token = config.getTokenInfoByAddress(hubPoolChainId, l1Token);
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
