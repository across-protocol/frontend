import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { utils } from "@across-protocol/sdk";
import axios from "axios";

import { TypedVercelRequest } from "./_types";
import { HUB_POOL_CHAIN_ID, getLogger, handleErrorCondition } from "./_utils";
import { UnauthorizedError } from "./_errors";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "./_constants";

import { getEnvs } from "./_env";

const { CRON_SECRET } = getEnvs();

const endpoints = [
  {
    url: "https://app.across.to/api/swap/approval",
    params: {
      amount: ethers.utils.parseUnits("1", 6).toString(),
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
      originChainId: CHAIN_IDs.ARBITRUM,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
      destinationChainId: CHAIN_IDs.OPTIMISM,
      depositor: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
      skipOriginTxEstimation: true,
      skipChecks: true,
      refundOnOrigin: true,
    },
    updateIntervalSec: 1,
    expectedStatus: 200,
  },
  // Preview endpoints for gasless flows. Ping to keep warm.
  {
    url: "https://preview.across.to/api/swap/erc3009",
    params: {
      amount: ethers.utils.parseUnits("0.1", 6).toString(),
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
      originChainId: CHAIN_IDs.OPTIMISM,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
      destinationChainId: CHAIN_IDs.BASE,
      depositor: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
    },
    updateIntervalSec: 1,
    expectedStatus: 200,
  },
  {
    url: "https://preview.across.to/api/gasless/submit",
    params: {},
    updateIntervalSec: 1,
    expectedStatus: 405, // Method Not Allowed
  },
];

const maxDurationSec = 60;

const handler = async (
  request: TypedVercelRequest<Record<string, never>>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "CronPingEndpoints",
    message: "Starting cron job...",
  });
  try {
    const authHeader = request.headers?.["authorization"];
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      throw new UnauthorizedError();
    }

    // Skip cron job on testnet
    if (HUB_POOL_CHAIN_ID !== 1) {
      return;
    }

    const functionStart = Date.now();

    const requestPromises = endpoints.map(
      async ({ updateIntervalSec, url, params, expectedStatus }) => {
        while (true) {
          const diff = Date.now() - functionStart;
          // Stop after `maxDurationSec` seconds
          if (diff >= maxDurationSec * 1000) {
            break;
          }
          try {
            await axios.get(url, { params });
          } catch (error) {
            if (
              axios.isAxiosError(error) &&
              error.response?.status !== expectedStatus
            ) {
              logger.warn({
                at: "CronPingEndpoints#requestPromises",
                message: `Failed to ping endpoint ${url}`,
                error,
              });
            }
          } finally {
            await utils.delay(updateIntervalSec);
          }
        }
      }
    );
    await Promise.all(requestPromises);

    logger.debug({
      at: "CronPingEndpoints",
      message: "Finished",
    });
    response.status(200);
    response.send("OK");
  } catch (error: unknown) {
    return handleErrorCondition("cron-ping-endpoints", response, logger, error);
  }
};

export default handler;
