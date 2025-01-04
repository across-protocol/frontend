import { VercelResponse } from "@vercel/node";
import {
  buildDepositForSimulation,
  getGasMarkup,
  getLogger,
  getMaxFeePerGas,
  getRelayerFeeCalculatorQueries,
  handleErrorCondition,
  sendResponse,
} from "./_utils";
import { TypedVercelRequest } from "./_types";
import { ethers } from "ethers";
import * as sdk from "@across-protocol/sdk";

import mainnetChains from "../src/data/chains_1.json";
import {
  DEFAULT_SIMULATED_RECIPIENT_ADDRESS,
  TOKEN_SYMBOLS_MAP,
} from "./_constants";
import { assert, Infer, object, optional, string } from "superstruct";

const chains = mainnetChains;

const QueryParamsSchema = object({
  symbol: optional(string()),
});
type QueryParams = Infer<typeof QueryParamsSchema>;

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
    const gasPrices = await Promise.all(
      Object.keys(chainIdsWithToken).map((chainId) => {
        return getMaxFeePerGas(Number(chainId));
      })
    );
    const gasCosts = await Promise.all(
      Object.entries(chainIdsWithToken).map(([chainId, tokenAddress], i) => {
        const depositArgs = {
          amount: ethers.BigNumber.from(100),
          inputToken: sdk.constants.ZERO_ADDRESS,
          outputToken: tokenAddress,
          recipientAddress: DEFAULT_SIMULATED_RECIPIENT_ADDRESS,
          originChainId: 0, // Shouldn't matter for simulation
          destinationChainId: Number(chainId),
        };
        const relayerFeeCalculatorQueries = getRelayerFeeCalculatorQueries(
          Number(chainId)
        );
        return relayerFeeCalculatorQueries.getGasCosts(
          buildDepositForSimulation(depositArgs),
          undefined,
          {
            gasPrice: gasPrices[i].maxFeePerGas,
          }
        );
      })
    );
    const responseJson = {
      tokenSymbol,
      ...Object.fromEntries(
        Object.keys(chainIdsWithToken).map(([chainId], i) => [
          chainId,
          {
            gasPrice: gasPrices[i].maxFeePerGas.toString(),
            gasPriceComponents: {
              maxFeePerGas: gasPrices[i].maxFeePerGas
                .sub(gasPrices[i].maxPriorityFeePerGas)
                .toString(),
              priorityFeePerGas: gasPrices[i].maxPriorityFeePerGas.toString(),
              baseFeeMultiplier: ethers.utils.formatEther(
                getGasMarkup(chainId)
              ),
            },
            nativeGasCost: gasCosts[i].nativeGasCost.toString(),
            tokenGasCost: gasCosts[i].tokenGasCost.toString(),
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
