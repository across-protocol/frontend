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
  positiveIntStr,
  sendResponse,
  validAddress,
} from "./_utils";

const LiquidReservesQueryParamsSchema = object({
  l1Token: validAddress(),
  originChainId: positiveIntStr(),
});

type LiquidReservesQueryParamsSchema = Infer<
  typeof LiquidReservesQueryParamsSchema
>;

// Returns the HubPool liquid reserves minus the LP cushion. Useful for relayers to query so that they don't
// fill deposits that would overcommit the reserves.
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
    const { l1Token, originChainId } = query;

    const l1TokenDetails = getTokenByAddress(query.l1Token, HUB_POOL_CHAIN_ID);
    if (!l1TokenDetails) {
      throw new InputError(`Unsupported L1 token address: ${query.l1Token}`);
    }
    if (!originChainId) {
      throw new InputError("Query param 'originChainId' must be provided");
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
      getLpCushion(l1TokenDetails.symbol, Number(originChainId)),
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
