import { useQuery } from "@tanstack/react-query";
import { BigNumber, constants, ethers, utils } from "ethers";

import { useConnectionEVM } from "hooks/useConnectionEVM";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { useBalance } from "hooks/useBalance";
import {
  max,
  getProvider,
  gasExpenditureDeposit,
  gasMultiplierPerChain,
  getEcosystem,
} from "utils";
import { SelectedRoute } from "../utils";

export function useMaxBalance(selectedRoute: SelectedRoute) {
  const balanceTokenSymbol =
    selectedRoute.type === "swap"
      ? selectedRoute.swapTokenSymbol
      : selectedRoute.fromTokenSymbol;

  const originChainEcosystem = getEcosystem(selectedRoute.fromChain);

  const { account: accountEVM, signer } = useConnectionEVM();
  const { account: accountSVM, provider: providerSVM } = useConnectionSVM();

  const account =
    originChainEcosystem === "evm" ? accountEVM : accountSVM?.toBase58();

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

      if (account && balance) {
        if (originChainEcosystem === "evm") {
          // EVM logic: subtract gas costs for native tokens
          if (signer) {
            maxBridgeAmount =
              balanceTokenSymbol !== "ETH"
                ? balance
                : // For ETH, we need to take the gas costs into account before setting the max. bridgable amount
                  await estimateGasCostsForDeposit(selectedRoute, signer).then(
                    (estimatedGasCosts) =>
                      max(balance.sub(estimatedGasCosts), 0)
                  );
          } else {
            maxBridgeAmount = constants.Zero;
          }
        } else {
          // for SOL support, we need to estimate tx cost like above.
          // for now we only support USDC
          maxBridgeAmount = balance;
        }
      } else {
        maxBridgeAmount = constants.Zero;
      }

      return maxBridgeAmount;
    },
    enabled: Boolean(
      account &&
        balance &&
        (originChainEcosystem === "evm" ? signer : providerSVM)
    ),
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
