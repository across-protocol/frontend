import { VercelResponse } from "@vercel/node";
import { clients } from "@across-protocol/sdk-v2";
import { object, assert, Infer, optional } from "superstruct";

import {
  handleErrorCondition,
  ENABLED_TOKEN_SYMBOLS,
  SUPPORTED_CHAIN_IDS,
  getWinstonLogger,
  validTokenSymbol,
  getHubAndSpokeClients,
} from "./_utils";
import { TypedVercelRequest } from "./_types";

const SPOKE_POOL_FROM_BLOCK_MS_OFFSET = 24 * 60 * 60 * 1000; // 24 hours

const UBAClientStateQueryParamsSchema = object({
  tokenSymbol: optional(validTokenSymbol()),
});

type AvailableRoutesQueryParams = Infer<typeof UBAClientStateQueryParamsSchema>;

const handler = async (
  { query }: TypedVercelRequest<AvailableRoutesQueryParams>,
  response: VercelResponse
) => {
  const logger = getWinstonLogger();
  logger.debug({
    at: "UBABundleState",
    message: "Query data",
    query,
  });

  try {
    assert(query, UBAClientStateQueryParamsSchema);
    const { tokenSymbol } = query;
    const tokenSymbolUpper = tokenSymbol?.toUpperCase();
    const tokenSymbols = tokenSymbolUpper
      ? [tokenSymbolUpper === "ETH" ? "WETH" : tokenSymbolUpper]
      : ENABLED_TOKEN_SYMBOLS;

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
      tokenSymbols.filter((symbol) => symbol !== "ETH"),
      true,
      1
    );
    const serializedUBAState = JSON.parse(
      clients.serializeUBAClientState(ubaClientState)
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
      responseJson: serializedUBAState,
    });
    response.setHeader(
      "Cache-Control",
      "s-maxage=180, stale-while-revalidate=120"
    );
    response.status(200).json(serializedUBAState);
  } catch (error: unknown) {
    return handleErrorCondition("uba-client-state", response, logger, error);
  }
};

export default handler;
