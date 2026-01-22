import { ethers } from "ethers";

import { TOKEN_SYMBOLS_MAP } from "./_constants";
import { getChainInfo } from "./_utils";
import { Token } from "./_dexes/types";

export function getNativeTokenInfo(chainId: number): Token {
  const chainInfo = getChainInfo(chainId);
  const token =
    TOKEN_SYMBOLS_MAP[chainInfo.nativeToken as keyof typeof TOKEN_SYMBOLS_MAP];
  return {
    chainId,
    address: ethers.constants.AddressZero,
    decimals: token.decimals,
    symbol: token.symbol,
  };
}
