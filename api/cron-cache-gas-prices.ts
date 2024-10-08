import { VercelResponse } from "@vercel/node";
import { TypedVercelRequest } from "./_types";
import {
  HUB_POOL_CHAIN_ID,
  getLogger,
  getMaxFeePerGas,
  handleErrorCondition,
  latestGasPriceCache,
} from "./_utils";
import { UnauthorizedError } from "./_errors";

import mainnetChains from "../src/data/chains_1.json";
import { fixedPointAdjustment } from "utils";
import { utils } from "@across-protocol/sdk";

const updateIntervalsSecPerChain = {
  default: 10,
  1: 12,
};

const SECONDS_OF_GAS_AVERAGE = 2 * 60 * 60; // 2 hours

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
      // Resolve how often we will be polling this chain for gas prices
      const secondsPerUpdateForChain =
        updateIntervalsSecPerChain[
          chain.chainId as keyof typeof updateIntervalsSecPerChain
        ] || updateIntervalsSecPerChain.default;

      while (true) {
        const diff = Date.now() - functionStart;
        // Stop after `maxDurationSec` seconds
        if (diff >= maxDurationSec * 1000) {
          break;
        }
        // Resolve the caching abstraction for the current chain
        const cache = latestGasPriceCache(chain.chainId);
        // Grab into the cache to get the previous value of the gas price
        // and directly compute the current value of the gas price.
        // Note: If the cache is empty, this fn will return a direct
        //       value from the chain.
        const [previousGasPrice, currentGasPrice] = await Promise.all([
          cache.get(),
          getMaxFeePerGas(chain.chainId),
        ]);
        // Resolve and scale our alpha value
        const alpha = fixedPointAdjustment
          .mul(secondsPerUpdateForChain)
          .div(SECONDS_OF_GAS_AVERAGE);
        // We are computing an exponential weighted moving average of the
        // gas price. To do this, we will follow the formula:
        // newValue = (1 - alpha) * previousValue + alpha * currentValue
        const newGasAverage = fixedPointAdjustment
          .sub(alpha)
          .mul(previousGasPrice)
          .add(alpha.mul(currentGasPrice));
        // Scale the value back and set it in the cache
        await cache.set(newGasAverage.div(fixedPointAdjustment));
        // Sleep for `updateIntervalSec` seconds
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
