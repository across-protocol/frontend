import { VercelResponse } from "@vercel/node";
import { TypedVercelRequest } from "./_types";

import {
  HUB_POOL_CHAIN_ID,
  getLogger,
  handleErrorCondition,
  getL1TokenConfigCache,
} from "./_utils";
import { UnauthorizedError } from "./_errors";

import mainnetChains from "../src/data/chains_1.json";

const handler = async (
  request: TypedVercelRequest<Record<string, never>>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "CronCacheL1TokenConfigs",
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
      return;
    }

    const mainnetChain = mainnetChains.find((chain) => chain.chainId === 1);

    if (!mainnetChain) {
      throw new Error("Mainnet chain not found");
    }

    const l1TokenAddresses = mainnetChain.inputTokens.map(
      (token) => token.address
    );
    const setL1TokenConfigTasks = l1TokenAddresses.map((l1TokenAddress) => {
      try {
        const l1TokenConfigCache = getL1TokenConfigCache(l1TokenAddress);
        logger.info({
          at: "CronCacheL1TokenConfigs",
          message: `Caching L1 token config for ${l1TokenAddress}`,
        });
        return l1TokenConfigCache.set();
      } catch (e) {
        logger.error({
          at: "CronCacheL1TokenConfigs",
          message: `Error caching L1 token config for ${l1TokenAddress}`,
          error: e,
        });
        throw e;
      }
    });
    await Promise.all(setL1TokenConfigTasks);

    logger.debug({
      at: "CronCacheL1TokenConfigs",
      message: "Finished",
    });
    response.status(200);
    response.send("OK");
  } catch (error: unknown) {
    return handleErrorCondition(
      "cron-cache-l1-token-configs",
      response,
      logger,
      error
    );
  }
};

export default handler;
