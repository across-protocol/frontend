import { VercelResponse } from "@vercel/node";
import { DepositRoute, TypedVercelRequest } from "./_types";
import {
  HUB_POOL_CHAIN_ID,
  getCachedNativeGasCost,
  getCachedOpStackL1DataFee,
  getLogger,
  getVercelHeaders,
  handleErrorCondition,
  resolveVercelEndpoint,
} from "./_utils";
import { UnauthorizedError } from "./_errors";

import mainnetChains from "../src/data/chains_1.json";
import { utils, constants } from "@across-protocol/sdk";
import { DEFAULT_SIMULATED_RECIPIENT_ADDRESS } from "./_constants";
import axios from "axios";
import { ethers } from "ethers";

// Set lower than TTL in getCachedOpStackL1DataFee
// Set lower than the L1 block time so we can try to get as up to date L1 data fees based on L1 base fees as possible.
const updateIntervalsSecPerChain = {
  default: 10,
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
    at: "CronCacheL1DataFee",
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
        at: "CronCacheL1DataFee",
        message: "Skipping cron job on testnet",
      });
      return;
    }

    const availableRoutes = (
      await axios(`${resolveVercelEndpoint()}/api/available-routes`, {
        headers: getVercelHeaders(),
      })
    ).data as Array<DepositRoute>;

    // This marks the timestamp when the function started
    const functionStart = Date.now();

    const updateCounts: Record<number, Record<string, number>> = {};

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
      updateCounts[chainId] ??= {};
      updateCounts[chainId][outputTokenAddress] ??= 0;
      const secondsPerUpdate = updateIntervalsSecPerChain.default;
      const depositArgs = getDepositArgsForChainId(chainId, outputTokenAddress);
      const gasCostCache = getCachedNativeGasCost(depositArgs);

      while (true) {
        const diff = Date.now() - functionStart;
        // Stop after `maxDurationSec` seconds
        if (diff >= maxDurationSec * 1000) {
          break;
        }
        const gasCost = await gasCostCache.get();
        const cache = getCachedOpStackL1DataFee(depositArgs, gasCost);
        try {
          await cache.set();
          updateCounts[chainId][outputTokenAddress]++;
        } catch (err) {
          logger.warn({
            at: "CronCacheL1DataFee#updateL1DataFeePromise",
            message: `Failed to set l1 data fee cache for chain ${chainId}`,
            depositArgs,
            gasCost,
            error: err,
          });
        }
        await utils.delay(secondsPerUpdate);
      }
    };

    const getOutputTokensToChain = (chainId: number) => {
      const destinationTokens = new Set<string>();
      availableRoutes
        .filter(({ destinationChainId }) => destinationChainId === chainId)
        .forEach(({ destinationToken }) => {
          if (!destinationTokens.has(destinationToken)) {
            destinationTokens.add(destinationToken);
          }
        });
      return Array.from(destinationTokens);
    };

    const cacheUpdatePromise = Promise.all(
      mainnetChains
        .filter((chain) => utils.chainIsOPStack(chain.chainId))
        .map(async (chain) => {
          await Promise.all(
            getOutputTokensToChain(chain.chainId).map((outputToken) =>
              updateL1DataFeePromise(chain.chainId, outputToken)
            )
          );
        })
    );
    // There are many routes and therefore many promises to wait to resolve so we force the
    // function to stop after `maxDurationSec` seconds.
    await Promise.race([cacheUpdatePromise, utils.delay(maxDurationSec)]);

    logger.debug({
      at: "CronCacheL1DataFee",
      message: "Finished",
      updateCounts,
    });
    response.status(200).json({ updateCounts });
  } catch (error: unknown) {
    return handleErrorCondition(
      "cron-cache-l1-data-fee",
      response,
      logger,
      error
    );
  }
};

export default handler;
