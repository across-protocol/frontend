import { VercelResponse } from "@vercel/node";
import { TypedVercelRequest } from "./_types";
import {
  HUB_POOL_CHAIN_ID,
  getLogger,
  handleErrorCondition,
  latestGasPriceCache,
} from "./_utils";
import { UnauthorizedError } from "./_errors";

import mainnetChains from "../src/data/chains_1.json";
import { utils } from "@across-protocol/sdk";

const updateIntervalsSecPerChain = {
  default: 10,
  1: 12,
};

const maxDurationSec = 60;

const handler = async (
  request: TypedVercelRequest<Record<string, never>>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "CronCacheGasPrices",
    message: "Starting cron job...",
  });
  try {
    const authHeader = request.headers?.["authorization"];
    if (
      !process.env.CRON_SECRET ||
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      throw new UnauthorizedError();
    }

    // Skip cron job on testnet
    if (HUB_POOL_CHAIN_ID !== 1) {
      logger.info({
        at: "CronCacheGasPrices",
        message: "Skipping cron job on testnet",
      });
      return;
    }

    // This marks the timestamp when the function started
    const functionStart = Date.now();

    // The minimum interval for Vercel Serverless Functions cron jobs is 1 minute.
    // But we want to update gas prices more frequently than that.
    // To circumvent this, we run the function in a loop and update gas prices every
    // `secondsPerUpdateForChain` seconds and stop after `maxDurationSec` seconds (1 minute).
    const gasPricePromises = mainnetChains.map(async (chain) => {
      const secondsPerUpdateForChain =
        updateIntervalsSecPerChain[
          chain.chainId as keyof typeof updateIntervalsSecPerChain
        ] || updateIntervalsSecPerChain.default;
      const cache = latestGasPriceCache(chain.chainId);

      while (true) {
        const diff = Date.now() - functionStart;
        // Stop after `maxDurationSec` seconds
        if (diff >= maxDurationSec * 1000) {
          break;
        }
        await cache.set();
        await utils.delay(secondsPerUpdateForChain);
      }
    });
    await Promise.all(gasPricePromises);

    logger.debug({
      at: "CronCacheGasPrices",
      message: "Finished",
    });
    response.status(200);
    response.send("OK");
  } catch (error: unknown) {
    return handleErrorCondition(
      "cron-cache-gas-prices",
      response,
      logger,
      error
    );
  }
};

export default handler;
