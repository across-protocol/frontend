import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { BLOCK_TAG_LAG } from "./_constants";
import { TypedVercelRequest } from "./_types";
import { object, assert, Infer } from "superstruct";

import {
  HUB_POOL_CHAIN_ID,
  InputError,
  callViaMulticall3,
  getHubPool,
  getLogger,
  getLpCushion,
  getProvider,
  getTokenByAddress,
  handleErrorCondition,
  sendResponse,
  validAddress,
} from "./_utils";

const LiquidReservesQueryParamsSchema = object({
  l1Token: validAddress(),
});

type LiquidReservesQueryParamsSchema = Infer<
  typeof LiquidReservesQueryParamsSchema
>;

// Returns the HubPool liquid reserves minus the LP cushion. Useful for relayers to query so that they don't
// fill deposits that would overcommit the reserves.
// Note: this always uses the default LP cushion for a token and does not let the caller specify an origin chain
// or destination chain, so it should be used to get the max liquid reserves that can support an L2 to L1 transfer
// where L2 is not the HubPool chain.
const handler = async (
  { query }: TypedVercelRequest<LiquidReservesQueryParamsSchema>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "LiquidReserves",
    message: "Query data",
    query,
  });
  try {
    assert(query, LiquidReservesQueryParamsSchema);
    const { l1Token } = query;

    const l1TokenDetails = getTokenByAddress(query.l1Token, HUB_POOL_CHAIN_ID);
    if (!l1TokenDetails) {
      throw new InputError(`Unsupported L1 token address: ${query.l1Token}`);
    }

    const provider = getProvider(HUB_POOL_CHAIN_ID);
    const hubPool = getHubPool(provider);
    const multiCalls = [
      { contract: hubPool, functionName: "sync", args: [l1Token] },
      {
        contract: hubPool,
        functionName: "pooledTokens",
        args: [l1Token],
      },
    ];

    const [multicallOutput] = await Promise.all([
      callViaMulticall3(provider, multiCalls, { blockTag: BLOCK_TAG_LAG }),
    ]);

    const { liquidReserves } = multicallOutput[1];
    const lpCushion = ethers.utils.parseUnits(
      getLpCushion(l1TokenDetails.symbol),
      l1TokenDetails.decimals
    );
    const liquidReservesWithCushion = liquidReserves.sub(lpCushion);

    const responseJson = {
      liquidReserves: liquidReserves.toString(),
      lpCushion: lpCushion.toString(),
      liquidReservesWithCushion: liquidReservesWithCushion.toString(),
    };
    logger.debug({
      at: "LiquidReserves",
      message: "Response data",
      responseJson,
    });
    // Respond with a 200 status code and 7 minutes of cache with
    // a minute of stale-while-revalidate.
    sendResponse(response, responseJson, 200, 420, 60);
  } catch (error: unknown) {
    return handleErrorCondition("liquidReserves", response, logger, error);
  }
};

export default handler;
