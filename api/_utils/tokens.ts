import { BigNumber } from "ethers";
import { utils } from "@across-protocol/sdk";

import { BLOCK_TAG_LAG } from "../_constants";

import { getProvider } from "./providers";

/**
 * Resolves the balance of a given ERC20 token at a provided address. If no token is provided, the balance of the
 * native currency will be returned.
 * @param chainId The blockchain Id to query against
 * @param account A valid Web3 wallet address
 * @param token The valid ERC20 token address on the given `chainId`.
 * @returns A promise that resolves to the BigNumber of the balance
 */
export const getBalance = (
  chainId: string | number,
  account: string,
  token: string,
  blockTag?: string | number
): Promise<BigNumber> => {
  return utils.getTokenBalance(
    account,
    token,
    getProvider(Number(chainId)),
    blockTag ?? BLOCK_TAG_LAG
  );
};
