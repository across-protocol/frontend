import { useQuery } from "react-query";
import { BigNumber, constants } from "ethers";

import { useBalanceBySymbol, useConnection } from "hooks";
import { Route, max, getProvider, gasExpenditureDeposit } from "utils";

export function useMaxBalance(selectedRoute: Route) {
  const { balance } = useBalanceBySymbol(
    selectedRoute.fromTokenSymbol,
    selectedRoute.fromChain
  );
  const { account, signer } = useConnection();

  return useQuery(
    [
      "max-balance",
      selectedRoute.fromTokenSymbol,
      selectedRoute.fromChain,
      account,
    ],
    async () => {
      let maxBridgeAmount: BigNumber;

      if (account && balance && signer) {
        maxBridgeAmount =
          selectedRoute.fromTokenSymbol !== "ETH"
            ? balance
            : // For ETH, we need to take the gas costs into account before setting the max. bridgable amount
              await estimateGasCostsForDeposit(selectedRoute).then(
                (estimatedGasCosts) => max(balance.sub(estimatedGasCosts), 0)
              );
      } else {
        maxBridgeAmount = constants.Zero;
      }

      return maxBridgeAmount;
    },
    {
      enabled: Boolean(account && balance && signer),
      retry: true,
    }
  );
}

async function estimateGasCostsForDeposit(selectedRoute: Route) {
  const provider = getProvider(selectedRoute.fromChain);
  const gasPrice = await provider.getGasPrice();
  return gasPrice.mul(gasExpenditureDeposit);
}
