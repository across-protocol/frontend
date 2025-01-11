import { VercelResponse } from "@vercel/node";
import { TypedVercelRequest } from "./_types";
import {
  HUB_POOL_CHAIN_ID,
  getCachedNativeGasCost,
  getCachedOpStackL1DataFee,
  getLogger,
  handleErrorCondition,
  latestGasPriceCache,
  resolveVercelEndpoint,
} from "./_utils";
import { UnauthorizedError } from "./_errors";

import mainnetChains from "../src/data/chains_1.json";
import { utils, constants } from "@across-protocol/sdk";
import { CHAIN_IDs, DEFAULT_SIMULATED_RECIPIENT_ADDRESS } from "./_constants";
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

// Set slightly lower than TTL in latestGasPriceCache
const updateIntervalsSecPerChain = {
  default: 5,
  1: 12,
};

// Set slightly lower than TTL in getCachedOpStackL1DataFee.
const updateL1DataFeeIntervalsSecPerChain = {
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
     * @notice Updates the gas price cache every `updateIntervalsSecPerChain` seconds up to `maxDurationSec` seconds.
     * @param chainId Chain to estimate gas price for
     * @param outputTokenAddress Optional param to set if the gas price is dependent on the calldata of the transaction
     * to be submitted on the chainId. This output token will be used to construct a fill transaction to simulate.
     */
    const updateGasPricePromise = async (
      chainId: number,
      outputTokenAddress?: string
    ) => {
      const secondsPerUpdateForChain =
        updateIntervalsSecPerChain[
          chainId as keyof typeof updateIntervalsSecPerChain
        ] || updateIntervalsSecPerChain.default;
      const cache = latestGasPriceCache(
        chainId,
        outputTokenAddress
          ? getDepositArgsForChainId(chainId, outputTokenAddress)
          : undefined
      );

      while (true) {
        const diff = Date.now() - functionStart;
        // Stop after `maxDurationSec` seconds
        if (diff >= maxDurationSec * 1000) {
          break;
        }
        await cache.set();
        await utils.delay(secondsPerUpdateForChain);
      }
    };

    /**
     * @notice Updates the L1 data fee and L2 gas cost caches every `updateL1DataFeeIntervalsSecPerChain` seconds
     * up to `maxDurationSec` seconds.
     * @dev This function will also update the L2 gas costs because this value is required to get the L1 data fee.
     * @param chainId Chain to estimate gas price for
     * @param outputTokenAddress This output token will be used to construct a fill transaction to simulate
     * gas costs for.
     */
    const updateL1DataFeePromise = async (
      chainId: number,
      outputTokenAddress: string
    ) => {
      const secondsPerUpdateForChain =
        updateL1DataFeeIntervalsSecPerChain.default;
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
        await cache.set();
        await utils.delay(secondsPerUpdateForChain);
      }
    };

    // The minimum interval for Vercel Serverless Functions cron jobs is 1 minute.
    // But we want to update gas data more frequently than that.
    // To circumvent this, we run the function in a loop and update gas prices every
    // `secondsPerUpdateForChain` seconds and stop after `maxDurationSec` seconds (1 minute).
    const gasPricePromises = mainnetChains.map(async (chain) => {
      // For each chain:
      //    - update the destination gas price for the chain
      //  For each output token on that chain:
      //    - update the simulated gas costs for the token
      const routesToChain = availableRoutes.filter(
        ({ destinationChainId }) => destinationChainId === chain.chainId
      );
      const outputTokensForChain = routesToChain.map(
        ({ destinationToken }) => destinationToken
      );
      Promise.all(
        outputTokensForChain.map((outputToken) =>
          updateL1DataFeePromise(chain.chainId, outputToken)
        )
      );
      // @dev Linea gas prices are dependent on the L2 calldata to be submitted so compute one gas price for each output token
      if (chain.chainId === CHAIN_IDs.LINEA) {
        Promise.all(
          outputTokensForChain.map((outputToken) =>
            updateGasPricePromise(chain.chainId, outputToken)
          )
        );
      } else {
        updateGasPricePromise(chain.chainId);
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
