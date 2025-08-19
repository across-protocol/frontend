import { VercelResponse } from "@vercel/node";
import { TypedVercelRequest } from "./_types";
import * as sdk from "@across-protocol/sdk";

import {
  HUB_POOL_CHAIN_ID,
  getLogger,
  handleErrorCondition,
  getL1TokenConfigCache,
  callViaMulticall3,
  getProvider,
  ENABLED_ROUTES,
  parseL1TokenConfigSafe,
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

    const provider = getProvider(HUB_POOL_CHAIN_ID);
    const configStoreClient = new sdk.contracts.acrossConfigStore.Client(
      ENABLED_ROUTES.acrossConfigStoreAddress,
      provider
    );

    const l1TokenAddresses = mainnetChain.inputTokens.map(
      (token) => token.address
    );
    const multiCalls = l1TokenAddresses.map((l1TokenAddress) => ({
      contract: configStoreClient.contract,
      functionName: "l1TokenConfig",
      args: [l1TokenAddress],
    }));
    const rawConfigs = await callViaMulticall3(provider, multiCalls);
    const setL1TokenConfigTasks = rawConfigs.map(async (rawConfig, index) => {
      const l1TokenAddress = l1TokenAddresses[index];
      try {
        const parsedL1TokenConfig = parseL1TokenConfigSafe(String(rawConfig));
        if (!parsedL1TokenConfig) {
          return;
        }
        await getL1TokenConfigCache(l1TokenAddress).set(parsedL1TokenConfig);
        logger.info({
          at: "CronCacheL1TokenConfigs",
          message: `Caching L1 token config for ${l1TokenAddress}`,
        });
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
