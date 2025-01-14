import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { utils } from "@across-protocol/sdk";
import axios from "axios";

import { TypedVercelRequest } from "./_types";
import { HUB_POOL_CHAIN_ID, getLogger, handleErrorCondition } from "./_utils";
import { UnauthorizedError } from "./_errors";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "./_constants";

const endpoints = [
  {
    url: "https://preview.across.to/api/swap/allowance",
    params: {
      amount: ethers.utils.parseUnits("1", 6).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
      originChainId: CHAIN_IDs.ARBITRUM,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
      destinationChainId: CHAIN_IDs.OPTIMISM,
      depositor: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
      skipOriginTxEstimation: true,
      refundOnOrigin: false,
    },
    updateIntervalSec: 10,
  },
  {
    url: "https://preview.across.to/api/swap/auth",
    params: {
      amount: ethers.utils.parseUnits("1", 6).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
      originChainId: CHAIN_IDs.ARBITRUM,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
      destinationChainId: CHAIN_IDs.OPTIMISM,
      depositor: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
      skipOriginTxEstimation: true,
      refundOnOrigin: false,
    },
    updateIntervalSec: 10,
  },
  {
    url: "https://preview.across.to/api/swap/permit",
    params: {
      amount: ethers.utils.parseUnits("1", 6).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
      originChainId: CHAIN_IDs.ARBITRUM,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
      destinationChainId: CHAIN_IDs.OPTIMISM,
      depositor: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
      skipOriginTxEstimation: true,
      refundOnOrigin: false,
    },
    updateIntervalSec: 10,
  },
  {
    url: "https://preview.across.to/api/swap",
    params: {
      amount: ethers.utils.parseUnits("1", 6).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
      originChainId: CHAIN_IDs.ARBITRUM,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
      destinationChainId: CHAIN_IDs.OPTIMISM,
      depositor: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
      skipOriginTxEstimation: true,
      refundOnOrigin: false,
    },
    updateIntervalSec: 10,
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

    const functionStart = Date.now();

    const requestPromises = endpoints.map(
      async ({ updateIntervalSec, url, params }) => {
        while (true) {
          const diff = Date.now() - functionStart;
          // Stop after `maxDurationSec` seconds
          if (diff >= maxDurationSec * 1000) {
            break;
          }
          await axios.get(url, { params });
          await utils.delay(updateIntervalSec);
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
