import { solana } from "../../../../constants/chains/configs";
import { interchangeableTokensMap } from "../../../../constants/tokens";
import { EnrichedToken } from "./ChainTokenSelectorModal";

/**
 * Since we, temporarily, do not support destination swaps when bridging
 * from SVM, we filter out all tokens from the token selector that are
 * not bridgeable tokens.
 */
export const getBridgeableSvmTokenFilterPredicate =
  (isOriginToken: boolean, otherToken: EnrichedToken | null | undefined) =>
  (token: EnrichedToken) => {
    if (isOriginToken || otherToken?.chainId !== solana.chainId) return true;
    const bridgeableSvmTokenSymbol = "USDC";
    return (
      token.symbol === bridgeableSvmTokenSymbol ||
      interchangeableTokensMap[token.symbol]?.includes(bridgeableSvmTokenSymbol)
    );
  };
