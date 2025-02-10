import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { BigNumber } from "ethers";
import {
  rewardProgramTypes,
  defaultRefetchInterval,
  rewardsApiUrl,
  getToken,
  parseUnits,
  isDefined,
} from "utils";

export function useAvailableRemainingRewards(program?: rewardProgramTypes) {
  const { data } = useQuery({
    queryKey: [program] as [rewardProgramTypes],
    enabled: isDefined(program),
    refetchInterval: defaultRefetchInterval,
    queryFn: ({ queryKey: key }) =>
      key[0] === "op-rebates"
        ? resolveCurrentDispensedOpRewards()
        : Promise.resolve(undefined),
  });
  return {
    ...data,
    areRewardTokensAvailable: (program && data?.areTokensAvailable) ?? false,
  };
}

async function resolveCurrentDispensedOpRewards() {
  const { data } = await axios.get<{
    totalTokenAmount: string;
  }>(`${rewardsApiUrl}/rewards/op-rebates/stats`);
  const opToken = getToken("OP");
  const existingTokens = BigNumber.from(data.totalTokenAmount);
  const tokenCeiling = parseUnits("750000", opToken.decimals); // 750K tokens

  return {
    totalTokensDispensed: existingTokens,
    areTokensAvailable: existingTokens.lt(tokenCeiling),
  };
}
