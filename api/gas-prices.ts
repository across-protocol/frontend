import { VercelResponse } from "@vercel/node";
import {
  getLogger,
  handleErrorCondition,
  latestGasPriceCache,
  sendResponse,
} from "./_utils";
import { TypedVercelRequest } from "./_types";

import mainnetChains from "../src/data/chains_1.json";

const chains = mainnetChains;

const handler = async (
  _: TypedVercelRequest<Record<string, never>>,
  response: VercelResponse
) => {
  const logger = getLogger();

  try {
    const gasPrices = await Promise.all(
      chains.map(({ chainId }) => {
        return latestGasPriceCache(chainId).get();
      })
    );
    const responseJson = Object.fromEntries(
      chains.map(({ chainId }, i) => [chainId, gasPrices[i]])
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
