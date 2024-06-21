import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { BLOCK_TAG_LAG } from "./_constants";
import { TypedVercelRequest } from "./_types";
import { object, assert, Infer, string } from "superstruct";

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
} from "./_utils";

const LiquidReservesQueryParamsSchema = object({
  l1Tokens: string(),
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
    const { l1Tokens } = query;
    const parsedL1Tokens = l1Tokens
      .split(",")
      .filter((address) => ethers.utils.isAddress(address));
    logger.debug({
      at: "LiquidReserves",
      message: "Test",
      parsedL1Tokens,
    });

    const l1TokenDetails = parsedL1Tokens.map((_l1Token) =>
      getTokenByAddress(_l1Token, HUB_POOL_CHAIN_ID)
    );
    if (!l1TokenDetails) {
      throw new InputError(
        `Query contains an unsupported L1 token address: ${query.l1Tokens}`
      );
    }

    const provider = getProvider(HUB_POOL_CHAIN_ID);
    const hubPool = getHubPool(provider);
    const multiCalls = [
      // Simulate syncing all L1 tokens and then query pooledToken for reserves data post-sync
      ...parsedL1Tokens.map((_l1Token) => {
        return {
          contract: hubPool,
          functionName: "sync",
          args: [_l1Token],
        };
      }),
      ...parsedL1Tokens.map((_l1Token) => {
        return {
          contract: hubPool,
          functionName: "pooledTokens",
          args: [_l1Token],
        };
      }),
    ];

    const [multicallOutput, ...lpCushions] = await Promise.all([
      callViaMulticall3(provider, multiCalls, { blockTag: BLOCK_TAG_LAG }),
      ...l1TokenDetails.map((_l1Token) =>
        Promise.resolve(
          ethers.utils.parseUnits(
            getLpCushion(_l1Token!.symbol),
            _l1Token!.decimals
          )
        )
      ),
    ]);
    const liquidReservesForL1Tokens = multicallOutput.slice(
      parsedL1Tokens.length
    );

    const responses = Object.fromEntries(
      parsedL1Tokens.map((_l1Token, i) => {
        const { liquidReserves } = liquidReservesForL1Tokens[i];
        const lpCushion = lpCushions[i];
        const liquidReservesWithCushion = liquidReserves.sub(lpCushion);
        return [_l1Token, liquidReservesWithCushion.toString()];
      })
    );

    logger.debug({
      at: "LiquidReserves",
      message: "Response data",
      responses,
    });
    // Respond with a 200 status code and 7 minutes of cache with
    // a minute of stale-while-revalidate.
    sendResponse(response, responses, 200, 420, 60);
  } catch (error: unknown) {
    return handleErrorCondition("liquidReserves", response, logger, error);
  }
};

export default handler;
