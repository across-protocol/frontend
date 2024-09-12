import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { TypedVercelRequest } from "./_types";

import {
  HUB_POOL_CHAIN_ID,
  getLogger,
  handleErrorCondition,
  latestBalanceCache,
} from "./_utils";

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
    const authHeader = (request.headers as any)?.get("authorization");
    if (
      !process.env.CRON_SECRET ||
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return response.status(401).json({ success: false });
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

    for (const chain of mainnetChains) {
      for (const token of chain.inputTokens) {
        const setTokenBalance = async (relayer: string) => {
          await latestBalanceCache(chain.chainId, relayer, token.address).set();
        };
        await Promise.all([
          Promise.all(fullRelayers.map(setTokenBalance)),
          Promise.all(transferRestrictedRelayers.map(setTokenBalance)),
        ]);
      }
    }

    logger.debug({
      at: "CronCacheBalances",
      message: "Finished",
    });
    response.status(200);
  } catch (error: unknown) {
    return handleErrorCondition("cron-cache-balances", response, logger, error);
  }
};

export default handler;
