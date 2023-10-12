import { useQuery } from "react-query";
import { BigNumber, providers, constants, utils } from "ethers";

import { useBalanceBySymbol, useConnection } from "hooks";
import {
  getConfig,
  Route,
  max,
  getProvider,
  fallbackEstimatedGasCosts,
} from "utils";
import { getPaddedGasEstimation } from "utils/transactions";

const config = getConfig();

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
              await estimateGasCostsForDeposit(selectedRoute, signer)
                .then((estimatedGasCosts) =>
                  max(balance.sub(estimatedGasCosts), 0)
                )
                .catch((err) => {
                  console.error(err);
                  return max(balance.sub(fallbackEstimatedGasCosts), 0);
                });
      } else {
        maxBridgeAmount = constants.Zero;
      }

      return maxBridgeAmount;
    },
    {
      enabled: Boolean(account && balance && signer),
    }
  );
}

async function estimateGasCostsForDeposit(
  selectedRoute: Route,
  signer: providers.JsonRpcSigner
) {
  const provider = getProvider(selectedRoute.fromChain);
  const spokePool = config.getSpokePool(selectedRoute.fromChain, signer);
  const tokenInfo = config.getTokenInfoByAddress(
    selectedRoute.fromChain,
    selectedRoute.fromTokenAddress
  );
  const amount = utils.parseUnits("0.000001", tokenInfo.decimals);
  const argsForEstimation = {
    recipient: await signer.getAddress(),
    originToken: tokenInfo.address,
    amount,
    destinationChain: selectedRoute.toChain,
    relayerFeePct: 0,
    quoteTimestamp: BigNumber.from(Math.floor(Date.now() / 1000)).sub(60 * 60),
    message: "0x",
    maxCount: constants.MaxUint256,
  };
  const paddedGasEstimation = await getPaddedGasEstimation(
    selectedRoute.fromChain,
    spokePool,
    "deposit",
    ...Object.values(argsForEstimation),
    { value: selectedRoute.isNative ? amount : 0 }
  );
  const gasPrice = await provider.getGasPrice();
  return gasPrice.mul(paddedGasEstimation);
}
