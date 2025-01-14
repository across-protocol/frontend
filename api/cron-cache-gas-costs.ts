import { VercelResponse } from "@vercel/node";
import { TypedVercelRequest } from "./_types";
import {
  HUB_POOL_CHAIN_ID,
  getCachedNativeGasCost,
  getCachedOpStackL1DataFee,
  getLogger,
  handleErrorCondition,
  resolveVercelEndpoint,
} from "./_utils";
import { UnauthorizedError } from "./_errors";

import mainnetChains from "../src/data/chains_1.json";
import { utils, constants } from "@across-protocol/sdk";
import { DEFAULT_SIMULATED_RECIPIENT_ADDRESS } from "./_constants";
import axios from "axios";
import { ethers } from "ethers";

type Route = {
  originChainId: number;
  originToken: string;
  destinationChainId: number;
  destinationToken: string;
  originTokenSymbol: string;
  destinationTokenSymbol: string;
};

// Set lower than TTL in getCachedOpStackL1DataFee
// Set lower than the L1 block time so we can try to get as up to date L1 data fees based on L1 base fees as possible.
const updateL1DataFeeIntervalsSecPerChain = {
  default: 10,
};

// Set lower than TTL in getCachedNativeGasCost. This should rarely change so we should just make sure
// we keep this cache warm.
const updateNativeGasCostIntervalsSecPerChain = {
  default: 20,
};

const maxDurationSec = 60;

const getDepositArgsForChainId = (chainId: number, tokenAddress: string) => {
  return {
    amount: ethers.BigNumber.from(100),
    inputToken: constants.ZERO_ADDRESS,
    outputToken: tokenAddress,
    recipientAddress: DEFAULT_SIMULATED_RECIPIENT_ADDRESS,
    originChainId: 0, // Shouldn't matter for simulation
    destinationChainId: Number(chainId),
  };
};

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

    const availableRoutes = (
      await axios(`${resolveVercelEndpoint()}/api/available-routes`)
    ).data as Array<Route>;

    // This marks the timestamp when the function started
    const functionStart = Date.now();

    /**
     * @notice Updates the L1 data fee gas cost cache every `updateL1DataFeeIntervalsSecPerChain` seconds
     * up to `maxDurationSec` seconds.
     * @param chainId Chain to estimate l1 data fee for
     * @param outputTokenAddress This output token will be used to construct a fill transaction to simulate
     * gas costs for.
     */
    const updateL1DataFeePromise = async (
      chainId: number,
      outputTokenAddress: string
    ): Promise<void> => {
      const secondsPerUpdate = updateL1DataFeeIntervalsSecPerChain.default;
      const depositArgs = getDepositArgsForChainId(chainId, outputTokenAddress);
      const gasCostCache = getCachedNativeGasCost(depositArgs);

      while (true) {
        const diff = Date.now() - functionStart;
        // Stop after `maxDurationSec` seconds
        if (diff >= maxDurationSec * 1000) {
          break;
        }
        const gasCost = await gasCostCache.get();
        if (utils.chainIsOPStack(chainId)) {
          const cache = getCachedOpStackL1DataFee(depositArgs, gasCost);
          try {
            await cache.set();
          } catch (err) {
            logger.warn({
              at: "CronCacheGasPrices#updateL1DataFeePromise",
              message: `Failed to set l1 data fee cache for chain ${chainId}`,
              depositArgs,
              gasCost,
              error: err,
            });
          }
        }
        await utils.delay(secondsPerUpdate);
      }
    };

    /**
     * @notice Updates the native gas cost cache every `updateNativeGasCostIntervalsSecPerChain` seconds
     * up to `maxDurationSec` seconds.
     * @param chainId Chain to estimate gas cost for
     * @param outputTokenAddress This output token will be used to construct a fill transaction to simulate
     * gas costs for.
     */
    const updateNativeGasCostPromise = async (
      chainId: number,
      outputTokenAddress: string
    ): Promise<void> => {
      const secondsPerUpdate = updateNativeGasCostIntervalsSecPerChain.default;
      const depositArgs = getDepositArgsForChainId(chainId, outputTokenAddress);
      const cache = getCachedNativeGasCost(depositArgs);

      while (true) {
        const diff = Date.now() - functionStart;
        // Stop after `maxDurationSec` seconds
        if (diff >= maxDurationSec * 1000) {
          break;
        }
        try {
          await cache.set();
        } catch (err) {
          logger.warn({
            at: "CronCacheGasPrices#updateNativeGasCostPromise",
            message: `Failed to set native gas cost cache for chain ${chainId}`,
            depositArgs,
            error: err,
          });
        }
        await utils.delay(secondsPerUpdate);
      }
    };

    // The minimum interval for Vercel Serverless Functions cron jobs is 1 minute.
    // But we want to update gas data more frequently than that.
    // To circumvent this, we run the function in a loop and update gas prices every
    // `secondsPerUpdateForChain` seconds and stop after `maxDurationSec` seconds (1 minute).
    const cacheUpdatePromises = Promise.all([
      mainnetChains.map(async (chain) => {
        const routesToChain = availableRoutes.filter(
          ({ destinationChainId }) => destinationChainId === chain.chainId
        );
        const outputTokensForChain = routesToChain.map(
          ({ destinationToken }) => destinationToken
        );
        return Promise.all([
          Promise.all(
            outputTokensForChain.map((outputToken) =>
              updateNativeGasCostPromise(chain.chainId, outputToken)
            )
          ),
          Promise.all(
            outputTokensForChain.map((outputToken) =>
              updateL1DataFeePromise(chain.chainId, outputToken)
            )
          ),
        ]);
      }),
    ]);

    // The above promises are supposed to complete after maxDurationSec seconds, but there are so many of them
    // (one per route) that they last one can run quite a bit longer, so force the function to stop after maxDurationSec
    // so that the serverless function can exit successfully.
    await Promise.race([cacheUpdatePromises, utils.delay(maxDurationSec)]);

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
