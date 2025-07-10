import { useQuery } from "@tanstack/react-query";
import getApiEndpoint from "utils/serverless-api";

export function useRelayerConfigs() {
  return useQuery({
    queryKey: ["relayer-configs"],
    queryFn: getApiEndpoint().relayerConfigs,
    refetchInterval: 2000,
  });
}
