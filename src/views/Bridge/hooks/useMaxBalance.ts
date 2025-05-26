import { useQuery } from "@tanstack/react-query";
import { BigNumber, constants, ethers, utils } from "ethers";

import { useConnection } from "hooks";
import { useBalance } from "hooks/useBalance_new";
import {
  max,
  getProvider,
  gasExpenditureDeposit,
  gasMultiplierPerChain,
} from "utils";
import { SelectedRoute } from "../utils";

export function useMaxBalance(selectedRoute: SelectedRoute) {
  const balanceTokenSymbol =
    selectedRoute.type === "swap"
      ? selectedRoute.swapTokenSymbol
      : selectedRoute.fromTokenSymbol;

  const { account, signer } = useConnection();

  const { balance } = useBalance(balanceTokenSymbol, selectedRoute.fromChain);

  return useQuery({
    queryKey: [
      "max-balance",
      balanceTokenSymbol,
      selectedRoute.fromChain,
      account,
      balance?.toString(),
    ],
    queryFn: async () => {
      let maxBridgeAmount: BigNumber;

      if (account && balance && signer) {
        maxBridgeAmount =
          balanceTokenSymbol !== "ETH"
            ? balance
            : // For ETH, we need to take the gas costs into account before setting the max. bridgable amount
              await estimateGasCostsForDeposit(selectedRoute, signer).then(
                (estimatedGasCosts) => max(balance.sub(estimatedGasCosts), 0)
              );
      } else {
        maxBridgeAmount = constants.Zero;
      }

      return maxBridgeAmount;
    },
    enabled: Boolean(account && balance && signer),
    retry: true,
  });
}

/**
 * Estimated gas costs for a deposit with an empty message.
 * This is used to calculate the maximum amount of ETH that can be bridged.
 */
async function estimateGasCostsForDeposit(
  selectedRoute: SelectedRoute,
  provider?: ethers.providers.JsonRpcSigner | ethers.providers.JsonRpcProvider
) {
  provider ??= getProvider(selectedRoute.fromChain);
  const gasPrice = await provider.getGasPrice();
  const gasMultiplier = gasMultiplierPerChain[selectedRoute.fromChain] || 3;
  return gasPrice
    .mul(utils.parseEther(String(gasMultiplier)))
    .mul(gasExpenditureDeposit)
    .div(constants.WeiPerEther);
}
