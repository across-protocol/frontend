import { VercelResponse } from "@vercel/node";
import {
  getCachedFillGasUsage,
  getLogger,
  handleErrorCondition,
  latestGasPriceCache,
  sendResponse,
} from "./_utils";
import { TypedVercelRequest } from "./_types";
import { ethers } from "ethers";
import * as sdk from "@across-protocol/sdk";

import mainnetChains from "../src/data/chains_1.json";
import { DEFAULT_SIMULATED_RECIPIENT_ADDRESS } from "./_constants";

const chains = mainnetChains;

const handler = async (
  _: TypedVercelRequest<Record<string, never>>,
  response: VercelResponse
) => {
  const logger = getLogger();

  try {
    const [gasPrices, gasCosts] = await Promise.all([
      chains.map(({ chainId }) => {
        return latestGasPriceCache(chainId).get();
      }),
      chains.map(({ chainId }) => {
        const depositArgs = {
          amount: ethers.BigNumber.from(100),
          inputToken: sdk.constants.ZERO_ADDRESS,
          outputToken: sdk.constants.ZERO_ADDRESS,
          recipientAddress: DEFAULT_SIMULATED_RECIPIENT_ADDRESS,
          originChainId: 0, // Shouldn't matter for simulation
          destinationChainId: chainId,
        };
        return getCachedFillGasUsage(depositArgs);
      }),
    ]);
    const responseJson = Object.fromEntries(
      chains.map(({ chainId }, i) => [
        chainId,
        {
          gasPrice: gasPrices[i].toString(),
          gasCost: gasCosts[i].toString(),
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
