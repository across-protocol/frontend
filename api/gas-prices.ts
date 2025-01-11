import { VercelResponse } from "@vercel/node";
import {
  getCachedNativeGasCost,
  getCachedOpStackL1DataFee,
  getGasMarkup,
  getLogger,
  handleErrorCondition,
  latestGasPriceCache,
  sendResponse,
} from "./_utils";
import { TypedVercelRequest } from "./_types";
import { ethers } from "ethers";
import * as sdk from "@across-protocol/sdk";

import mainnetChains from "../src/data/chains_1.json";
import {
  CHAIN_IDs,
  DEFAULT_SIMULATED_RECIPIENT_ADDRESS,
  TOKEN_SYMBOLS_MAP,
} from "./_constants";
import { assert, Infer, object, optional, string } from "superstruct";

const chains = mainnetChains;

const QueryParamsSchema = object({
  symbol: optional(string()),
});
type QueryParams = Infer<typeof QueryParamsSchema>;

const getDepositArgsForChainId = (chainId: number, tokenAddress: string) => {
  return {
    amount: ethers.BigNumber.from(100),
    inputToken: sdk.constants.ZERO_ADDRESS,
    outputToken: tokenAddress,
    recipientAddress: DEFAULT_SIMULATED_RECIPIENT_ADDRESS,
    originChainId: 0, // Shouldn't matter for simulation
    destinationChainId: Number(chainId),
  };
};
const handler = async (
  { query }: TypedVercelRequest<QueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  assert(query, QueryParamsSchema);
  const tokenSymbol = query.symbol ?? "WETH";

  try {
    const chainIdsWithToken: { [chainId: string]: string } = Object.fromEntries(
      chains
        .map(({ chainId }) => {
          const tokenAddress =
            TOKEN_SYMBOLS_MAP?.[tokenSymbol as keyof typeof TOKEN_SYMBOLS_MAP]
              ?.addresses[chainId];
          return [chainId, tokenAddress];
        })
        .filter(([, tokenAddress]) => tokenAddress !== undefined)
    );
    const gasData = await Promise.all(
      Object.entries(chainIdsWithToken).map(([chainId, tokenAddress]) => {
        const depositArgs = getDepositArgsForChainId(
          Number(chainId),
          tokenAddress
        );
        return Promise.all([
          getCachedNativeGasCost(depositArgs).get(),
          latestGasPriceCache(
            Number(chainId),
            CHAIN_IDs.LINEA === Number(chainId) ? depositArgs : undefined
          ).get(),
        ]);
      })
    );
    // We query the following gas costs after gas prices because token gas costs and op stack l1 gas costs
    // depend on the gas price and native gas unit results.
    const gasCosts = await Promise.all(
      Object.entries(chainIdsWithToken).map(
        async ([chainId, tokenAddress], i) => {
          const depositArgs = getDepositArgsForChainId(
            Number(chainId),
            tokenAddress
          );
          const [nativeGasCost, gasPrice] = gasData[i];
          const opStackL1GasCost = sdk.utils.chainIsOPStack(Number(chainId))
            ? await getCachedOpStackL1DataFee(depositArgs, nativeGasCost).get()
            : undefined;
          const tokenGasCost = nativeGasCost
            .mul(gasPrice.maxFeePerGas)
            .add(opStackL1GasCost ?? ethers.BigNumber.from("0"));
          return {
            nativeGasCost,
            tokenGasCost,
            opStackL1GasCost,
          };
        }
      )
    );
    const responseJson = {
      tokenSymbol,
      ...Object.fromEntries(
        Object.keys(chainIdsWithToken).map((chainId, i) => [
          chainId,
          {
            gasPrice: gasData[i][1].maxFeePerGas.toString(),
            gasPriceComponents: {
              maxFeePerGas: gasData[i][1].maxFeePerGas
                .sub(gasData[i][1].maxPriorityFeePerGas)
                .toString(),
              priorityFeePerGas: gasData[i][1].maxPriorityFeePerGas.toString(),
              baseFeeMultiplier: ethers.utils.formatEther(
                getGasMarkup(chainId).baseFeeMarkup
              ),
              priorityFeeMultiplier: ethers.utils.formatEther(
                getGasMarkup(chainId).priorityFeeMarkup
              ),
              opStackL1GasCostMultiplier: sdk.utils.chainIsOPStack(
                Number(chainId)
              )
                ? ethers.utils.formatEther(
                    getGasMarkup(chainId).opStackL1DataFeeMarkup
                  )
                : undefined,
            },
            nativeGasCost: gasCosts[i].nativeGasCost.toString(),
            tokenGasCost: gasCosts[i].tokenGasCost.toString(),
            opStackL1GasCost: gasCosts[i]?.opStackL1GasCost?.toString(),
          },
        ])
      ),
    };

    logger.debug({
      at: "GasPrices",
      message: "Response data",
      responseJson,
    });
    // Respond with a 200 status code and 10 seconds of cache with
    // 45 seconds of stale-while-revalidate.
    sendResponse(response, responseJson, 200, 10, 45);
  } catch (error: unknown) {
    return handleErrorCondition("gas-prices", response, logger, error);
  }
};

export default handler;
