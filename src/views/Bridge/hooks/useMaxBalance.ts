import { useQuery } from "react-query";
import { BigNumber, constants, utils } from "ethers";

import { useBalanceBySymbol, useConnection } from "hooks";
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

  const { balance } = useBalanceBySymbol(
    balanceTokenSymbol,
    selectedRoute.fromChain
  );
  const { account, signer } = useConnection();

  return useQuery(
    ["max-balance", balanceTokenSymbol, selectedRoute.fromChain, account],
    async () => {
      let maxBridgeAmount: BigNumber;

      if (account && balance && signer) {
        maxBridgeAmount =
          balanceTokenSymbol !== "ETH"
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

/**
 * Estimated gas costs for a deposit with an empty message.
 * This is used to calculate the maximum amount of ETH that can be bridged.
 */
async function estimateGasCostsForDeposit(selectedRoute: SelectedRoute) {
  const provider = getProvider(selectedRoute.fromChain);
  const gasPrice = await provider.getGasPrice();
  const gasMultiplier = gasMultiplierPerChain[selectedRoute.fromChain] || 3;
  return gasPrice
    .mul(utils.parseEther(String(gasMultiplier)))
    .mul(gasExpenditureDeposit)
    .div(constants.WeiPerEther);
}
