import { useQuery } from "react-query";
import { splashGetDepositStatsQueryKey } from "utils";
import getApiEndpoint from "utils/serverless-api";
import { GetDepositStatsInterface } from "utils/serverless-api/types";

export function useSplashDynamicData() {
  const queryKey = splashGetDepositStatsQueryKey();

  const { data } = useQuery(queryKey, async () => {
    const apiCall = await getApiEndpoint().splash.getStats();
    return formatResult(apiCall);
  });

  return data;
}

function formatResult(data: GetDepositStatsInterface) {
  return {
    ...data,
    avgFillTimeInMinutes: data.avgFillTime / 60,
  };
}
