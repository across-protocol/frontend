import { clients } from "@across-protocol/sdk-v2";
import assert from "assert";
import dotenv from "dotenv";
import { createClient } from "@vercel/kv";

import {
  ENABLED_TOKEN_SYMBOLS,
  SUPPORTED_CHAIN_IDS,
  getWinstonLogger,
  getHubAndSpokeClients,
  logDuration,
  getUBAClientSubStateCacheKey,
} from "../api/_utils";

dotenv.config();

async function main() {
  // Job-defined env vars
  const { CLOUD_RUN_TASK_INDEX = 0, CLOUD_RUN_TASK_ATTEMPT = 0 } = process.env;

  const logger = getWinstonLogger();
  logger.info(
    `Starting task #${CLOUD_RUN_TASK_INDEX} attempt #${CLOUD_RUN_TASK_ATTEMPT} at ` +
      new Date().toISOString()
  );

  try {
    // Required user-defined env vars
    const { REACT_APP_PUBLIC_INFURA_ID, KV_REST_API_TOKEN, KV_REST_API_URL } =
      process.env;
    assert(
      Boolean(REACT_APP_PUBLIC_INFURA_ID),
      "Missing env var: REACT_APP_PUBLIC_INFURA_ID"
    );
    assert(
      Boolean(KV_REST_API_TOKEN) && Boolean(KV_REST_API_URL),
      "Missing env vars: KV_REST_API_TOKEN and/or KV_REST_API_URL"
    );

    // Optional user-defined env vars
    const SPOKE_POOL_FROM_BLOCK_MS_OFFSET = Number(
      process.env.SPOKE_POOL_FROM_BLOCK_MS_OFFSET || 24 * 60 * 60 * 1000 // default to 1 day
    );
    const DISABLED_SPOKE_POOL_CHAIN_IDS = (
      process.env.DISABLED_SPOKE_POOL_CHAIN_IDS || "288"
    )
      .split(",")
      .map(Number);
    const PROVIDER_REQUEST_TIMEOUT_MS = Number(
      process.env.PROVIDER_REQUEST_TIMEOUT_MS || 60 * 1000 // default to 1 minute
    );
    const PROVIDER_REQUESTS_MAX_CONCURRENCY = Number(
      process.env.PROVIDER_REQUESTS_MAX_CONCURRENCY || 100 // default to 200 concurrent requests
    );

    const relevantSpokePoolChainIds = SUPPORTED_CHAIN_IDS.filter(
      (chainId) => !DISABLED_SPOKE_POOL_CHAIN_IDS.includes(chainId)
    );
    const { hubPoolClient, spokePoolClientsMap } = await getHubAndSpokeClients(
      logger,
      SPOKE_POOL_FROM_BLOCK_MS_OFFSET,
      relevantSpokePoolChainIds,
      // These provider options are used to make many concurrent RPC requests to our provider
      // more reliable. If we use, for example, a single cached provider instance of `StaticJsonRpcProvider`,
      // we can run into issues where the RPC requests fail randomly for multiple concurrent requests and
      // connections.
      // Using multiple instances of `JsonRpcBatchProvider` instead makes the RPC requests more reliable.
      // We also limit the number of concurrent requests to avoid overloading the provider.
      {
        useBatch: true,
        maxConcurrency: PROVIDER_REQUESTS_MAX_CONCURRENCY,
        connectionInfo: {
          timeout: PROVIDER_REQUEST_TIMEOUT_MS,
        },
      }
    );

    // Manually update clients sequentially for better reliability and logging
    await logDuration(
      () => hubPoolClient.configStoreClient.update(),
      (durationMs) =>
        logger.info(`Updated ConfigStoreClient in ${durationMs}ms`)
    );
    await logDuration(
      () => hubPoolClient.update(),
      (durationMs) => logger.info(`Updated HubPoolClient in ${durationMs}ms`)
    );
    for (const spokePoolClient of Object.values(spokePoolClientsMap)) {
      await logDuration(
        () => spokePoolClient.update(),
        (durationMs) =>
          logger.info(
            `Updated SpokePoolClient for chain ${spokePoolClient.chainId} in ${durationMs}ms`
          )
      );
    }

    const ubaClientState = await clients.updateUBAClient(
      hubPoolClient,
      spokePoolClientsMap,
      relevantSpokePoolChainIds,
      ENABLED_TOKEN_SYMBOLS.filter((symbol) => symbol !== "ETH"),
      false,
      1
    );

    // Store separate sub-states per chain and token to make records smaller
    const subStates: Record<string, string> = {};
    for (const chainId in ubaClientState) {
      const chainState = ubaClientState[chainId];
      for (const tokenSymbol in chainState.bundles) {
        const subState = {
          [chainId]: {
            spokeChain: chainState.spokeChain,
            bundles: {
              [tokenSymbol]: chainState.bundles[tokenSymbol],
            },
          },
        };
        subStates[`${chainId}-${tokenSymbol}`] =
          clients.serializeUBAClientState(subState);
      }
    }

    logger.info("Storing sub states on redis...");
    const redisClient = createClient({
      token: KV_REST_API_TOKEN!,
      url: KV_REST_API_URL!,
    });
    for (const chainTokenCombi in subStates) {
      const [chainId, tokenSymbol] = chainTokenCombi.split("-");
      await redisClient.set(
        getUBAClientSubStateCacheKey(Number(chainId), tokenSymbol),
        subStates[chainTokenCombi]
      );
    }
    logger.info("Stored.");

    return;
  } catch (error) {
    logger.error({
      error: {
        message: (error as Error)?.message,
        stack: (error as Error)?.stack,
      },
    });
    process.exit(1); // Retry Job Task by exiting the process
  }
}

main();
