import { VercelResponse } from "@vercel/node";
import { BlockFinder } from "@uma/sdk";
import { clients } from "@across-protocol/sdk-v2";

import {
  handleErrorCondition,
  ENABLED_TOKEN_SYMBOLS,
  HUB_POOL_CHAIN_ID,
  HUB_POOL_DEPLOYMENT_BLOCK,
  SUPPORTED_CHAIN_IDS,
  getWinstonLogger,
  getAcrossConfigStore,
  getHubPool,
  getSpokePool,
  getProvider,
  relayFeeCalculatorConfig,
} from "./_utils";
import { SPOKE_POOLS, CONFIG_STORE_VERSION } from "./_constants";
import { TypedVercelRequest } from "./_types";

const SPOKE_POOL_FROM_BLOCK_MS_OFFSET = 24 * 60 * 60 * 1000; // 24 hours

const handler = async (_: TypedVercelRequest<{}>, response: VercelResponse) => {
  const logger = getWinstonLogger();
  logger.debug({
    at: "UBABundleState",
    message: "Query data",
  });

  try {
    const l1Provider = getProvider(HUB_POOL_CHAIN_ID);
    const l1LatestBlock = await l1Provider.getBlock("latest");

    const blockFinders: Record<
      string,
      BlockFinder<{ timestamp: number; number: number }>
    > = SUPPORTED_CHAIN_IDS.reduce((acc, chainId) => {
      const provider = getProvider(chainId);
      return {
        ...acc,
        [chainId]: new BlockFinder(provider.getBlock.bind(provider)),
      };
    }, {});
    const spokePoolFromBlocks = await Promise.all(
      SUPPORTED_CHAIN_IDS.map(async (chainId) => {
        const blockFinder = blockFinders[chainId];
        const spokePoolDeploymentBlock = await blockFinder.getBlockForTimestamp(
          Math.round((Date.now() - SPOKE_POOL_FROM_BLOCK_MS_OFFSET) / 1000)
        );
        return spokePoolDeploymentBlock.number;
      })
    );

    const configStoreClient = new clients.AcrossConfigStoreClient(
      logger,
      getAcrossConfigStore(),
      {
        fromBlock: HUB_POOL_DEPLOYMENT_BLOCK,
        maxBlockLookBack: 10_000,
      },
      CONFIG_STORE_VERSION,
      SUPPORTED_CHAIN_IDS
    );
    await configStoreClient.update();

    const hubPoolClient = new clients.HubPoolClient(
      logger,
      getHubPool(),
      configStoreClient,
      HUB_POOL_DEPLOYMENT_BLOCK,
      HUB_POOL_CHAIN_ID,
      {
        fromBlock: HUB_POOL_DEPLOYMENT_BLOCK,
        maxBlockLookBack: 10_000,
      }
    );

    const spokePoolClientsMap = SUPPORTED_CHAIN_IDS.reduce(
      (acc, chainId, i) => {
        return {
          ...acc,
          [chainId]: new clients.SpokePoolClient(
            logger,
            getSpokePool(chainId),
            hubPoolClient,
            chainId,
            SPOKE_POOLS[chainId].deploymentBlock,
            {
              fromBlock: spokePoolFromBlocks[i],
              maxBlockLookBack: 10_000,
            }
          ),
        };
      },
      {}
    );

    const ubaState = await clients.updateUBAClient(
      hubPoolClient,
      spokePoolClientsMap,
      SUPPORTED_CHAIN_IDS,
      ENABLED_TOKEN_SYMBOLS.filter((symbol) => symbol !== "ETH"),
      l1LatestBlock.number,
      true,
      relayFeeCalculatorConfig,
      1
    );

    // Explanation on how `s-maxage` and `stale-while-revalidate` work together:
    //
    // `s-maxage=X` indicates that the response remains fresh until X seconds after the response is generated.
    // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#response_directives
    //
    // `stale-while-revalidate=Y` indicates that the response can be used stale for Y seconds after it becomes stale.
    // At the same time, a revalidation request will be made in the background to populate the cache with a fresh value.
    // See https://vercel.com/docs/concepts/edge-network/caching#stale-while-revalidate
    logger.debug({
      at: "UBAClientState",
      message: "Response data",
      responseJson: ubaState,
    });
    response.setHeader(
      "Cache-Control",
      "s-maxage=180, stale-while-revalidate=120"
    );
    response.status(200).json(ubaState);
  } catch (error: unknown) {
    return handleErrorCondition("uba-client-state", response, logger, error);
  }
};

export default handler;
