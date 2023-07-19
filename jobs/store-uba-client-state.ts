import { clients } from "@across-protocol/sdk-v2";
import assert from "assert";
import { createClient } from "redis";
import dotenv from "dotenv";

import {
  ENABLED_TOKEN_SYMBOLS,
  SUPPORTED_CHAIN_IDS,
  getWinstonLogger,
  getHubAndSpokeClients,
} from "../api/_utils";
import { REDIS_LATEST_UBA_CLIENTS_STATE_KEY } from "../api/_constants";

dotenv.config();

const SPOKE_POOL_FROM_BLOCK_MS_OFFSET = 24 * 60 * 60 * 1000; // 24 hours

async function main() {
  // Job-defined env vars
  const { CLOUD_RUN_TASK_INDEX = 0, CLOUD_RUN_TASK_ATTEMPT = 0 } = process.env;

  const logger = getWinstonLogger();
  logger.info({
    at: "Job::StoreUBAClientState",
    message:
      `Starting task #${CLOUD_RUN_TASK_INDEX} attempt #${CLOUD_RUN_TASK_ATTEMPT} at` +
      new Date().toISOString(),
  });

  try {
    // Required user-defined env vars
    const { REACT_APP_PUBLIC_INFURA_ID, REDIS_URL } = process.env;

    assert(
      Boolean(REACT_APP_PUBLIC_INFURA_ID),
      "Missing env var: REACT_APP_PUBLIC_INFURA_ID"
    );
    assert(Boolean(REDIS_URL), "Missing env var: REDIS_URL");

    const { hubPoolClient, spokePoolClientsMap } = await getHubAndSpokeClients(
      logger,
      SPOKE_POOL_FROM_BLOCK_MS_OFFSET,
      // These provider options are used to make many concurrent RPC requests to our provider
      // more reliable. If we use, for example, a single cached provider instance of `StaticJsonRpcProvider`,
      // we can run into issues where the RPC requests fail randomly for multiple concurrent requests and
      // connections.
      // Using multiple instances of `JsonRpcBatchProvider` instead makes the RPC requests more reliable.
      {
        useBatch: true,
        useUncached: true,
      }
    );
    await hubPoolClient.configStoreClient.update();

    const ubaClientState = await clients.updateUBAClient(
      hubPoolClient,
      spokePoolClientsMap,
      SUPPORTED_CHAIN_IDS,
      ENABLED_TOKEN_SYMBOLS.filter((symbol) => symbol !== "ETH"),
      true,
      1
    );
    const serializedUBAState = clients.serializeUBAClientState(ubaClientState);

    logger.info("Connecting to Redis...");
    const redisClient = createClient({
      url: process.env.REDIS_URL,
    });
    await redisClient.connect();
    logger.info("Storing state on redis...");
    await redisClient.set(
      REDIS_LATEST_UBA_CLIENTS_STATE_KEY,
      serializedUBAState
    );
    logger.info("Stored.");
    await redisClient.disconnect();

    logger.info("Run successful.");
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
