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

const L1_EVENT_SEARCH_FROM_BLOCK_MS_OFFSET = 24 * 60 * 60 * 1000; // 24 hours

const handler = async (_: TypedVercelRequest<{}>, response: VercelResponse) => {
  const logger = getWinstonLogger();
  logger.debug({
    at: "UBABundleState",
    message: "Query data",
  });

  try {
    const l1Provider = getProvider(HUB_POOL_CHAIN_ID);
    const blockFinder = new BlockFinder(l1Provider.getBlock.bind(l1Provider));
    const [l1EventSearchFromBlock, l1LatestBlock] = await Promise.all([
      blockFinder.getBlockForTimestamp(
        Math.round((Date.now() - L1_EVENT_SEARCH_FROM_BLOCK_MS_OFFSET) / 1000)
      ),
      l1Provider.getBlock("latest"),
    ]);

    const configStoreClient = new clients.AcrossConfigStoreClient(
      logger,
      getAcrossConfigStore(),
      {
        fromBlock: 0,
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
        fromBlock: l1EventSearchFromBlock.number,
      }
    );

    const spokePoolClientsMap = SUPPORTED_CHAIN_IDS.reduce((acc, chainId) => {
      return {
        ...acc,
        [chainId]: new clients.SpokePoolClient(
          logger,
          getSpokePool(chainId),
          hubPoolClient,
          chainId,
          SPOKE_POOLS[chainId].deploymentBlock,
          {
            fromBlock: l1EventSearchFromBlock.number,
          }
        ),
      };
    }, {});

    const ubaState = await clients.updateUBAClient(
      hubPoolClient,
      spokePoolClientsMap,
      SUPPORTED_CHAIN_IDS,
      ENABLED_TOKEN_SYMBOLS,
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
