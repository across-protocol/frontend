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
import { ethers, providers } from "ethers";
import * as sdk from "@across-protocol/sdk";
import { L2Provider } from "@eth-optimism/sdk/dist/interfaces/l2-provider";

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
    // @dev getMaxFeePerGas will return the gas price after including the baseFeeMultiplier.
    const gasPrices = await Promise.all(
      Object.keys(chainIdsWithToken).map((chainId) => {
        return getMaxFeePerGas(Number(chainId));
      })
    );
    const gasCosts = await Promise.all(
      Object.entries(chainIdsWithToken).map(
        async ([chainId, tokenAddress], i) => {
          const depositArgs = {
            amount: ethers.BigNumber.from(100),
            inputToken: sdk.constants.ZERO_ADDRESS,
            outputToken: tokenAddress,
            recipientAddress: DEFAULT_SIMULATED_RECIPIENT_ADDRESS,
            originChainId: 0, // Shouldn't matter for simulation
            destinationChainId: Number(chainId),
          };
          const deposit = buildDepositForSimulation(depositArgs);
          const relayerFeeCalculatorQueries = getRelayerFeeCalculatorQueries(
            Number(chainId)
          );
          // OPStack chains factor in the L1 gas cost of including the L2 transaction in an L1 rollup batch
          // into the total gas cost of the L2 transaction.
          const getOpStackL1GasCost = async () => {
            if (sdk.utils.chainIsOPStack(Number(chainId))) {
              const provider = relayerFeeCalculatorQueries.provider;
              const unsignedTx = await sdk.utils.populateV3Relay(
                relayerFeeCalculatorQueries.spokePool,
                deposit,
                relayerFeeCalculatorQueries.simulatedRelayerAddress
              );
              return (
                provider as L2Provider<providers.Provider>
              ).estimateL1GasCost(unsignedTx);
            } else {
              return undefined;
            }
          };
          const [{ nativeGasCost, tokenGasCost }, opStackL1GasCost] =
            await Promise.all([
              relayerFeeCalculatorQueries.getGasCosts(
                deposit,
                relayerFeeCalculatorQueries.simulatedRelayerAddress,
                {
                  // @dev Pass in the already-computed gasPrice into this query so that the tokenGasCost includes
                  // the scaled gas price,
                  // e.g. tokenGasCost = nativeGasCost * (baseFee * baseFeeMultiplier + priorityFee).
                  gasPrice: gasPrices[i].maxFeePerGas,
                }
              ),
              getOpStackL1GasCost(),
            ]);
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
