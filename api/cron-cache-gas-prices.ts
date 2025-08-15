import { VercelResponse } from "@vercel/node";
import { utils } from "@across-protocol/sdk";
import axios from "axios";

import { DepositRoute, TypedVercelRequest } from "./_types";
import {
  HUB_POOL_CHAIN_ID,
  getLogger,
  getVercelHeaders,
  handleErrorCondition,
  latestGasPriceCache,
  resolveVercelEndpoint,
} from "./_utils";
import { UnauthorizedError } from "./_errors";
import { CHAIN_IDs } from "./_constants";
import { getDepositArgsForCachedGasDetails } from "./_gas";
import { getEnvs } from "./_env";

import mainnetChains from "../src/data/chains_1.json";

const { CRON_SECRET } = getEnvs();

// Set lower than TTL in latestGasPriceCache
const updateIntervalsSecPerChain = {
  default: 5,
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
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
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
      await axios(`${resolveVercelEndpoint()}/api/available-routes`, {
        headers: getVercelHeaders(),
      })
    ).data as Array<DepositRoute>;

    // This marks the timestamp when the function started
    const functionStart = Date.now();

    const updateCounts: Record<number, number> = {};

    /**
     * @notice Updates the gas price cache every `updateIntervalsSecPerChain` seconds up to `maxDurationSec` seconds.
     * @param chainId Chain to estimate gas price for
     * @param outputTokenAddress Optional param to set if the gas price is dependent on the calldata of the transaction
     * to be submitted on the chainId. This output token will be used to construct a fill transaction to simulate.
     */
    const updateGasPricePromise = async (
      chainId: number,
      outputTokenAddress?: string
    ): Promise<void> => {
      updateCounts[chainId] ??= 0;
      const secondsPerUpdateForChain = updateIntervalsSecPerChain.default;
      const depositArgs = outputTokenAddress
        ? getDepositArgsForCachedGasDetails(
            HUB_POOL_CHAIN_ID,
            chainId,
            outputTokenAddress
          )
        : undefined;
      const cache = latestGasPriceCache(chainId, depositArgs);

      while (true) {
        const diff = Date.now() - functionStart;
        // Stop after `maxDurationSec` seconds
        if (diff >= maxDurationSec * 1000) {
          break;
        }
        try {
          await cache.set();
          updateCounts[chainId]++;
        } catch (err) {
          logger.warn({
            at: "CronCacheGasPrices#updateGasPricePromise",
            message: `Failed to set gas price cache for chain ${chainId}`,
            depositArgs,
            error: err,
          });
        }
        await utils.delay(secondsPerUpdateForChain);
      }
    };

    const lineaDestinationRoutes = () => {
      const routes = new Set<string>();
      availableRoutes
        .filter(
          ({ destinationChainId }) => destinationChainId === CHAIN_IDs.LINEA
        )
        .forEach(({ destinationToken }) => routes.add(destinationToken));
      return Array.from(routes);
    };
    // The minimum interval for Vercel Serverless Functions cron jobs is 1 minute.
    // But we want to update gas data more frequently than that.
    // To circumvent this, we run the function in a loop and update gas prices every
    // `secondsPerUpdateForChain` seconds and stop after `maxDurationSec` seconds (1 minute).
    await Promise.all([
      // @dev Linea gas prices are dependent on the L2 calldata to be submitted so compute one gas price for each output token,
      // so we compute one gas price per output token for Linea
      Promise.all(
        mainnetChains
          .filter((chain) => chain.chainId !== CHAIN_IDs.LINEA)
          .map((chain) => updateGasPricePromise(chain.chainId))
      ),
      Promise.all(
        lineaDestinationRoutes().map((destinationToken) =>
          updateGasPricePromise(CHAIN_IDs.LINEA, destinationToken)
        )
      ),
    ]);

    logger.debug({
      at: "CronCacheGasPrices",
      message: "Finished",
      updateCounts,
    });
    response.status(200).json({ updateCounts });
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
