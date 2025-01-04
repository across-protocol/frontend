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
import { InvalidParamError } from "./_errors";

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
    const gasPrices = await Promise.all(
      chains.map(({ chainId }) => {
        return getMaxFeePerGas(chainId);
      })
    );
    const gasCosts = await Promise.all(
      chains.map(({ chainId }, i) => {
        const tokenAddress =
          TOKEN_SYMBOLS_MAP?.[tokenSymbol as keyof typeof TOKEN_SYMBOLS_MAP]
            ?.addresses[chainId];
        if (tokenAddress === undefined) {
          throw new InvalidParamError({
            message: `Input token symbol ${tokenSymbol} does not exist in TOKEN_SYMBOLS_MAP for chain ${chainId}`,
          });
        }
        const depositArgs = {
          amount: ethers.BigNumber.from(100),
          inputToken: sdk.constants.ZERO_ADDRESS,
          outputToken: tokenAddress,
          recipientAddress: DEFAULT_SIMULATED_RECIPIENT_ADDRESS,
          originChainId: 0, // Shouldn't matter for simulation
          destinationChainId: chainId,
        };
        const relayerFeeCalculatorQueries =
          getRelayerFeeCalculatorQueries(chainId);
        return relayerFeeCalculatorQueries.getGasCosts(
          buildDepositForSimulation(depositArgs),
          undefined,
          {
            gasPrice: gasPrices[i],
          }
        );
      })
    );
    const responseJson = Object.fromEntries(
      chains.map(({ chainId }, i) => [
        chainId,
        {
          gasPrice: gasPrices[i].toString(),
          baseFeeMultiplier: getGasMarkup(chainId).div(
            sdk.utils.fixedPointAdjustment
          ),
          nativeGasCost: gasCosts[i].nativeGasCost.toString(),
          tokenGasCost: gasCosts[i].tokenGasCost.toString(),
        },
      ])
    );

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
