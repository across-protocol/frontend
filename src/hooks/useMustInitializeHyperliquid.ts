import { CHAIN_IDs } from "@across-protocol/constants";
import { useQuery } from "@tanstack/react-query";
import { accountExistsOnHyperCore, Route } from "utils";

export function useMustInitializeHyperliquid(params: {
  account: string | undefined;
  route: Route;
}) {
  const { account, route } = params;
  return useQuery({
    queryKey: [
      "accountExistsOnHyperCore",
      account,
      route.toChain,
      route.fromTokenSymbol,
    ],
    queryFn: async () => {
      if (
        !account ||
        !(
          // only tell user to initialize for this specific route
          (
            route.toChain === CHAIN_IDs.HYPERCORE &&
            route.toTokenSymbol === "USDT-SPOT"
          )
        )
      ) {
        return false;
      }
      const accountExists = await accountExistsOnHyperCore({
        account,
      });

      return !accountExists;
    },
    enabled:
      route.toChain === CHAIN_IDs.HYPERCORE &&
      route.toTokenSymbol === "USDT-SPOT" &&
      !!account,
  });
}
