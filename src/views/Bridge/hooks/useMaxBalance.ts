import { useQuery } from "react-query";
import { BigNumber, providers, utils, constants } from "ethers";

import { useBalanceBySymbol, useConnection } from "hooks";
import { getConfig, Route, max, getProvider } from "utils";
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
                  return max(balance.sub(utils.parseEther("0.01")), 0);
                });
      } else {
        maxBridgeAmount = BigNumber.from(0);
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
  const spokePool = config.getSpokePool(selectedRoute.fromChain);
  const mockedArgs = {
    recipient: await signer.getAddress(),
    originToken: config.getTokenInfoByAddress(
      selectedRoute.fromChain,
      selectedRoute.fromTokenAddress
    ).address,
    amount: 1,
    destinationChain: selectedRoute.toChain,
    relayerFeePct: 1,
    quoteTimestamp: BigNumber.from(Math.floor(Date.now() / 1000)),
    message: "0x",
    maxCount: constants.MaxUint256,
  };
  const paddedGasEstimation = await getPaddedGasEstimation(
    selectedRoute.fromChain,
    spokePool,
    "deposit",
    ...Object.values(mockedArgs),
    { value: selectedRoute.isNative ? mockedArgs.amount : 0 }
  );
  const gasPrice = await provider.getGasPrice();
  return gasPrice.mul(paddedGasEstimation);
}
