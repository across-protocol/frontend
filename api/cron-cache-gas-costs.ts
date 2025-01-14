import { VercelResponse } from "@vercel/node";
import { DepositRoute, TypedVercelRequest } from "./_types";
import {
  HUB_POOL_CHAIN_ID,
  getCachedNativeGasCost,
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

// Set lower than TTL in getCachedNativeGasCost. This should rarely change so we should just make sure
// we keep this cache warm.
const updateIntervalsSecPerChain = {
  default: 30,
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
    at: "CronCacheGasCosts",
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
        at: "CronCacheGasCosts",
        message: "Skipping cron job on testnet",
      });
      return;
    }

    const availableRoutes = (
      await axios(`${resolveVercelEndpoint()}/api/available-routes`)
    ).data as Array<DepositRoute>;

    // This marks the timestamp when the function started
    const functionStart = Date.now();

    const updateCounts: Record<number, Record<string, number>> = {};

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
      updateCounts[chainId] ??= {};
      updateCounts[chainId][outputTokenAddress] ??= 0;
      const secondsPerUpdate = updateIntervalsSecPerChain.default;
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
          updateCounts[chainId][outputTokenAddress]++;
        } catch (err) {
          logger.warn({
            at: "CronCacheGasCosts#updateNativeGasCostPromise",
            message: `Failed to set native gas cost cache for chain ${chainId}`,
            depositArgs,
            error: err,
          });
        }
        await utils.delay(secondsPerUpdate);
      }
    };

    const getOutputTokensToChain = (chainId: number) =>
      availableRoutes
        .filter(({ destinationChainId }) => destinationChainId === chainId)
        .map(({ destinationToken }) => destinationToken);

    const cacheUpdatePromise = Promise.all(
      mainnetChains.map(async (chain) => {
        await Promise.all(
          getOutputTokensToChain(chain.chainId).map((outputToken) =>
            updateNativeGasCostPromise(chain.chainId, outputToken)
          )
        );
      })
    );
    // There are many routes and therefore many promises to wait to resolve so we force the
    // function to stop after `maxDurationSec` seconds.
    await Promise.race([cacheUpdatePromise, utils.delay(maxDurationSec)]);

    logger.debug({
      at: "CronCacheGasCosts",
      message: "Finished",
      updateCounts,
    });
    response.status(200);
    response.send("OK");
  } catch (error: unknown) {
    return handleErrorCondition(
      "cron-cache-gas-costs",
      response,
      logger,
      error
    );
  }
};

export default handler;
