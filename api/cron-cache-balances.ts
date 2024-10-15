import { VercelResponse } from "@vercel/node";
import { BigNumber, ethers } from "ethers";
import { TypedVercelRequest } from "./_types";

import {
  HUB_POOL_CHAIN_ID,
  getBatchBalanceViaMulticall3,
  getLogger,
  handleErrorCondition,
  latestBalanceCache,
} from "./_utils";
import { UnauthorizedError } from "./_errors";

import mainnetChains from "../src/data/chains_1.json";

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
    if (
      !process.env.CRON_SECRET ||
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      throw new UnauthorizedError();
    }

    const {
      REACT_APP_FULL_RELAYERS, // These are relayers running a full auto-rebalancing strategy.
      REACT_APP_TRANSFER_RESTRICTED_RELAYERS, // These are relayers whose funds stay put.
    } = process.env;

    const fullRelayers = !REACT_APP_FULL_RELAYERS
      ? []
      : (JSON.parse(REACT_APP_FULL_RELAYERS) as string[]).map((relayer) => {
          return ethers.utils.getAddress(relayer);
        });
    const transferRestrictedRelayers = !REACT_APP_TRANSFER_RESTRICTED_RELAYERS
      ? []
      : (JSON.parse(REACT_APP_TRANSFER_RESTRICTED_RELAYERS) as string[]).map(
          (relayer) => {
            return ethers.utils.getAddress(relayer);
          }
        );

    // Skip cron job on testnet
    if (HUB_POOL_CHAIN_ID !== 1) {
      return;
    }

    const allRelayers = [...fullRelayers, ...transferRestrictedRelayers];
    for (const chain of mainnetChains) {
      const batchResult = await getBatchBalanceViaMulticall3(
        chain.chainId,
        allRelayers,
        [
          ethers.constants.AddressZero,
          ...chain.outputTokens.map((token) => token.address),
        ]
      );
      await Promise.allSettled(
        allRelayers.map(async (relayer) => {
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
