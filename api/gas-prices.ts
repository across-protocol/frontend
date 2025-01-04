import { VercelResponse } from "@vercel/node";
import {
  buildDepositForSimulation,
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

const chains = mainnetChains;

const handler = async (
  _: TypedVercelRequest<Record<string, never>>,
  response: VercelResponse
) => {
  const logger = getLogger();

  try {
    const [gasPrices, gasCosts] = await Promise.all([
      await Promise.all(
        chains.map(({ chainId }) => {
          return getMaxFeePerGas(chainId);
        })
      ),
      await Promise.all(
        chains.map(async ({ chainId }) => {
          const depositArgs = {
            amount: ethers.BigNumber.from(100),
            inputToken: sdk.constants.ZERO_ADDRESS,
            outputToken: TOKEN_SYMBOLS_MAP?.WETH?.addresses?.[chainId],
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
              omitMarkup: true,
            }
          );
        })
      ),
    ]);
    const responseJson = Object.fromEntries(
      chains.map(({ chainId }, i) => [
        chainId,
        {
          gasPrice: gasPrices[i].toString(),
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
