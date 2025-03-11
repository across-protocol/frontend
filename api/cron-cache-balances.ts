import { VercelResponse } from "@vercel/node";
import { BigNumber, ethers } from "ethers";

import { TypedVercelRequest } from "./_types";
import { getEnvs } from "./_env";
import {
  HUB_POOL_CHAIN_ID,
  getBatchBalanceViaMulticall3,
  getLogger,
  handleErrorCondition,
  latestBalanceCache,
} from "./_utils";
import { UnauthorizedError } from "./_errors";
import { getFullRelayers } from "./_relayer-address";
import mainnetChains from "../src/data/chains_1.json";

const { CRON_SECRET } = getEnvs();

const handler = async (
  request: TypedVercelRequest<Record<string, never>>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "CronCacheBalances",
    message: "Starting cron job...",
  });
  try {
    const authHeader = request.headers?.["authorization"];
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      throw new UnauthorizedError();
    }

    const fullRelayers = getFullRelayers();

    // Skip cron job on testnet
    if (HUB_POOL_CHAIN_ID !== 1) {
      return;
    }

    for (const chain of mainnetChains) {
      const batchResult = await getBatchBalanceViaMulticall3(
        chain.chainId,
        fullRelayers,
        [
          ethers.constants.AddressZero,
          ...chain.outputTokens.map((token) => token.address),
        ]
      );
      await Promise.allSettled(
        fullRelayers.map(async (relayer) => {
          const results = await Promise.allSettled(
            chain.outputTokens.map((token) => {
              return latestBalanceCache({
                chainId: chain.chainId,
                address: relayer,
                tokenAddress: token.address,
              }).set(
                BigNumber.from(batchResult.balances[relayer][token.address])
              );
            })
          );

          const success = results.filter((res) => res.status === "fulfilled");
          const fail = results.filter((res) => res.status === "rejected");
          logger.debug({
            at: `CronCacheBalances`,
            chain: chain.chainId,
            relayer,
            message: `success: ${success.length}, fails: ${fail.length}`,
          });
        })
      );
    }

    logger.debug({
      at: "CronCacheBalances",
      message: "Finished",
    });
    response.status(200);
    response.send("OK");
  } catch (error: unknown) {
    return handleErrorCondition("cron-cache-balances", response, logger, error);
  }
};

export default handler;
