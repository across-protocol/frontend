import { VercelResponse } from "@vercel/node";
import {
  getCachedNativeGasCost,
  getCachedOpStackL1DataFee,
  getGasMarkup,
  getLogger,
  handleErrorCondition,
  latestGasPriceCache,
} from "./_utils";
import { TypedVercelRequest } from "./_types";
import { ethers } from "ethers";
import * as sdk from "@across-protocol/sdk";
import { sendResponse } from "./_response_utils";

import mainnetChains from "../src/data/chains_1.json";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "./_constants";
import { assert, Infer, optional, string, type } from "superstruct";
import { calcGasFeeDetails, getDepositArgsForCachedGasDetails } from "./_gas";

const chains = mainnetChains;

const QueryParamsSchema = type({
  symbol: optional(string()),
});

type QueryParams = Infer<typeof QueryParamsSchema>;

const handler = async (
  { query }: TypedVercelRequest<QueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  assert(query, QueryParamsSchema);
  let tokenSymbol = query.symbol ?? "WETH";
  tokenSymbol = tokenSymbol.toUpperCase();

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
    chainIdsWithToken[CHAIN_IDs.SOLANA] =
      TOKEN_SYMBOLS_MAP?.[
        tokenSymbol as keyof typeof TOKEN_SYMBOLS_MAP
      ]?.addresses[CHAIN_IDs.SOLANA];
    const gasData = await Promise.all(
      Object.entries(chainIdsWithToken).map(([chainId, tokenAddress]) => {
        const depositArgs = getDepositArgsForCachedGasDetails(
          Number(chainId),
          tokenAddress
        );
        // We only want to derive an unsigned fill txn from the deposit args if the
        // destination chain is Linea or Solana:
        // - Linea: Priority fee depends on the destination chain call data
        // - Solana: Compute units estimation fails for missing values
        const shouldUseDepositArgs =
          CHAIN_IDs.LINEA === Number(chainId) ||
          sdk.utils.chainIsSvm(Number(chainId));
        return Promise.all([
          getCachedNativeGasCost(depositArgs).get(),
          latestGasPriceCache(
            Number(chainId),
            shouldUseDepositArgs ? depositArgs : undefined
          ).get(),
        ]);
      })
    );
    // We query the following gas costs after gas prices because token gas costs and op stack l1 gas costs
    // depend on the gas price and native gas unit results.
    const gasCosts = await Promise.all(
      Object.entries(chainIdsWithToken).map(
        async ([chainId, tokenAddress], i) => {
          const depositArgs = getDepositArgsForCachedGasDetails(
            Number(chainId),
            tokenAddress
          );
          const [nativeGasCost, gasPrice] = gasData[i];
          const opStackL1GasCost = sdk.utils.chainIsOPStack(Number(chainId))
            ? await getCachedOpStackL1DataFee(depositArgs, nativeGasCost).get()
            : undefined;

          const gasFeeDetails = calcGasFeeDetails({
            gasPriceEstimate: gasPrice,
            nativeGasCost,
            opStackL1GasCost,
          });

          return gasFeeDetails;
        }
      )
    );
    const responseJson = {
      tokenSymbol,
      ...Object.fromEntries(
        Object.keys(chainIdsWithToken).map((chainId, i) => {
          const gasPriceEstimateEvm = gasData[
            i
          ][1] as sdk.gasPriceOracle.EvmGasPriceEstimate;
          const gasPriceEstimateSvm = gasData[
            i
          ][1] as sdk.gasPriceOracle.SvmGasPriceEstimate;

          const gasPrice =
            gasPriceEstimateEvm.maxFeePerGas &&
            gasPriceEstimateEvm.maxPriorityFeePerGas
              ? gasPriceEstimateEvm.maxFeePerGas
              : gasCosts[i].tokenGasCost;
          const gasPriceComponents =
            gasPriceEstimateEvm.maxFeePerGas &&
            gasPriceEstimateEvm.maxPriorityFeePerGas
              ? {
                  maxFeePerGas: gasPriceEstimateEvm.maxFeePerGas
                    .sub(gasPriceEstimateEvm.maxPriorityFeePerGas)
                    .toString(),
                  priorityFeePerGas:
                    gasPriceEstimateEvm.maxPriorityFeePerGas.toString(),
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
                }
              : {
                  baseFee: gasPriceEstimateSvm.baseFee.toString(),
                  microLamportsPerComputeUnit:
                    gasPriceEstimateSvm.microLamportsPerComputeUnit.toString(),
                  baseFeeMultiplier: ethers.utils.formatEther(
                    getGasMarkup(chainId).baseFeeMarkup
                  ),
                  priorityFeeMultiplier: ethers.utils.formatEther(
                    getGasMarkup(chainId).priorityFeeMarkup
                  ),
                };

          return [
            chainId,
            {
              gasPrice: gasPrice.toString(),
              gasPriceComponents,
              nativeGasCost: gasCosts[i].nativeGasCost.toString(),
              tokenGasCost: gasCosts[i].tokenGasCost.toString(),
              opStackL1GasCost: gasCosts[i]?.opStackL1GasCost?.toString(),
            },
          ];
        })
      ),
    };

    logger.debug({
      at: "GasPrices",
      message: "Response data",
      responseJson,
    });
    // Respond with a 200 status code and 10 seconds of cache with
    // 45 seconds of stale-while-revalidate.
    sendResponse({
      response,
      body: responseJson,
      statusCode: 200,
      cacheSeconds: 10,
      staleWhileRevalidateSeconds: 45,
    });
  } catch (error: unknown) {
    return handleErrorCondition("gas-prices", response, logger, error);
  }
};

export default handler;
