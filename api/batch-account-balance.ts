import { VercelResponse } from "@vercel/node";
import { assert, Infer, type, string, array } from "superstruct";
import { TypedVercelRequest } from "./_types";
import {
  getBatchBalanceViaMulticall3,
  getLogger,
  handleErrorCondition,
  validAddress,
} from "./_utils";

const BatchAccountBalanceQueryParamsSchema = type({
  tokenAddresses: array(validAddress()),
  addresses: array(validAddress()),
  chainId: string(),
});

type BatchAccountBalanceQueryParams = Infer<
  typeof BatchAccountBalanceQueryParamsSchema
>;

type BatchAccountBalanceResponse = Awaited<
  ReturnType<typeof getBatchBalanceViaMulticall3>
> & {
  chainId: number;
};

/**
 * ## Description
 * Returns balances (for a given list of ERC20 addresses (or native) ), as BigNumber strings, for a given list of relayer addresses, on a given chain
 *
 * ##  Example request:
 * ```typescript
 * const res = await fetch({{BASE_URL}}/api/batch-account-balance?chainId=1&tokenAddresses=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&tokenAddresses=0x0000000000000000000000000000000000000000&addresses=0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D&addresses=0xD25f7e77386F9f797b64E878A3D060956de99163&addresses=0xC54070dA79E7E3e2c95D3a91fe98A42000e65a48)
 *
 * //{
 * //  "blockNumber": "20534057",
 * //  "balances": {
 * //    "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D": {
 * //      "0x0000000000000000000000000000000000000000": "145024861164234695",
 * //      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "318280735"
 * //    },
 * //    "0xD25f7e77386F9f797b64E878A3D060956de99163": {
 * //      "0x0000000000000000000000000000000000000000": "257015615341203114",
 * //      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "0"
 * //    },
 * //    "0xC54070dA79E7E3e2c95D3a91fe98A42000e65a48": {
 * //      "0x0000000000000000000000000000000000000000": "103043184520327917",
 * //      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "0"
 * //    }
 * //  },
 * //  "chainId": "1"
 * //}
 * ```
 * @param tokenAddresses - list of ERC20 addresses or "zero" address, ie. 0x0000000000000000000000000000000000000000
 * @param addresses - list of accounts to query for balances
 * @param chainId - chainId on which we want to check balances
 */
const handler = async (
  { query }: TypedVercelRequest<BatchAccountBalanceQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "BatchAccountBalance",
    message: "Query data",
    query,
  });

  try {
    // Validate the query parameters
    assert(query, BatchAccountBalanceQueryParamsSchema);

    // Deconstruct the query parameters
    let { tokenAddresses, addresses, chainId } = query;
    const chainIdAsInt = Number(chainId);

    const result = await getBatchBalanceViaMulticall3(
      chainIdAsInt,
      addresses,
      tokenAddresses
    );

    const data: BatchAccountBalanceResponse = {
      ...result,
      chainId: chainIdAsInt,
    };

    // Log the response
    logger.debug({
      at: "BatchAccountBalance",
      message: "Response data",
      responseJson: data,
    });

    // Set the caching headers that will be used by the CDN.
    response.setHeader(
      "Cache-Control",
      "s-maxage=150, stale-while-revalidate=150"
    );

    // Return the response
    response.status(200).json(data);
  } catch (error: unknown) {
    return handleErrorCondition(
      "batch-account-balance",
      response,
      logger,
      error
    );
  }
};

export default handler;
