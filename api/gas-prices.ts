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
    // getMaxFeePerGas will return the gas price after including the baseFeeMultiplier.
    const gasPrices = await Promise.all(
      Object.keys(chainIdsWithToken).map((chainId) => {
        return getMaxFeePerGas(Number(chainId));
      })
    );
    const gasCosts = await Promise.all(
      Object.entries(chainIdsWithToken).map(
        async ([chainId, tokenAddress], i) => {
          // This is a dummy deposit used to pass into buildDepositForSimulation() to build a fill transaction
          // that we can simulate without reversion. The only parameter that matters is that the destinationChainId
          // is set to the spoke pool's chain ID we'll be simulating the fill call on.
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
          const { baseFeeMarkup, priorityFeeMarkup, opStackL1DataFeeMarkup } =
            getGasMarkup(Number(chainId));
          const { nativeGasCost, tokenGasCost, opStackL1GasCost, gasPrice } =
            await relayerFeeCalculatorQueries.getGasCosts(
              deposit,
              relayerFeeCalculatorQueries.simulatedRelayerAddress,
              {
                // Pass in the already-computed gasPrice into this query so that the tokenGasCost includes
                // the scaled gas price,
                // e.g. tokenGasCost = nativeGasCost * (baseFee * baseFeeMultiplier + priorityFee).
                // Except for Linea, where the gas price is dependent on the unsignedTx produced from the deposit,
                // so let the SDK compute its gas price here.
                gasPrice:
                  Number(chainId) === CHAIN_IDs.LINEA
                    ? undefined
                    : gasPrices[i].maxFeePerGas,
                opStackL1GasCostMultiplier: opStackL1DataFeeMarkup,
                baseFeeMultiplier: baseFeeMarkup,
                priorityFeeMultiplier: priorityFeeMarkup,
              }
            );
          return {
            nativeGasCost,
            tokenGasCost,
            opStackL1GasCost,
            gasPrice,
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
            gasPrice:
              Number(chainId) === CHAIN_IDs.LINEA
                ? gasCosts[i].gasPrice.toString()
                : gasPrices[i].maxFeePerGas.toString(),
            gasPriceComponents: {
              // Linea hardcodes base fee at 7 wei so we can always back it out fromthe gasPrice returned by the
              // getGasCosts method.
              maxFeePerGas:
                Number(chainId) === CHAIN_IDs.LINEA
                  ? gasCosts[i].gasPrice.sub(7).toString()
                  : gasPrices[i].maxFeePerGas
                      .sub(gasPrices[i].maxPriorityFeePerGas)
                      .toString(),
              priorityFeePerGas:
                Number(chainId) === CHAIN_IDs.LINEA
                  ? "7"
                  : gasPrices[i].maxPriorityFeePerGas.toString(),
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
