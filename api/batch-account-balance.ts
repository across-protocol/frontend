import { VercelResponse } from "@vercel/node";
import { assert, Infer, type, string, array } from "superstruct";
import { TypedVercelRequest } from "./_types";
import {
  getBatchBalanceViaMulticall3,
  getLogger,
  getProvider,
  handleErrorCondition,
  validAddress,
} from "./_utils";
import * as sdk from "@across-protocol/sdk";

const BatchAccountBalanceQueryParamsSchema = type({
  tokenAddress: validAddress(),
  addresses: array(validAddress()),
  chainId: string(),
});

type BatchAccountBalanceQueryParams = Infer<
  typeof BatchAccountBalanceQueryParamsSchema
>;

export type BatchAccountBalanceResponse = Record<
  BatchAccountBalanceQueryParams["addresses"][number],
  string
>;

/**
 * ## Description
 * Returns the ERC20 (or native) balances, as BigNumber strings, for a given list of relayer addresses, on a given chain
 *
 * ##  Example request:
 * ```bash
 * curl {{BASE_URL}}/api/batch-account-balance?chainId=1&tokenAddress=0x0000000000000000000000000000000000000000&addresses=0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D&addresses=0xD25f7e77386F9f797b64E878A3D060956de99163&addresses=0xC54070dA79E7E3e2c95D3a91fe98A42000e65a48
 * ```
 * @param tokenAddress - ERC20 address or "zero" address, ie. 0x0000000000000000000000000000000000000000
 * @param addresses - list of relayer addresses
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
    let { tokenAddress, addresses, chainId } = query;
    const chainIdAsInt = parseInt(chainId);

    let balances: BatchAccountBalanceResponse = {};

    const provider = getProvider(chainIdAsInt);

    if (tokenAddress === sdk.constants.ZERO_ADDRESS) {
      // fetch native balances
      const res = await Promise.all(
        addresses.map((a) => provider.getBalance(a, "latest"))
      );
      addresses.forEach(
        (address, i) => (balances[address] = res[i].toString())
      );
    } else {
      // fetch erc20 balances
      const res = await getBatchBalanceViaMulticall3(
        chainId,
        addresses,
        tokenAddress
      );
      addresses.forEach(
        (address, i) => (balances[address] = res[i].toString())
      );
    }

    // Log the response
    logger.debug({
      at: "BatchAccountBalance",
      message: "Response data",
      responseJson: balances,
    });
    // Set the caching headers that will be used by the CDN.
    response.setHeader(
      "Cache-Control",
      "s-maxage=150, stale-while-revalidate=150"
    );
    // Return the response
    response.status(200).json(balances);
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
