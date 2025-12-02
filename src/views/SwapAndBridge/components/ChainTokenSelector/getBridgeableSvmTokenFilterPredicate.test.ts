import { getBridgeableSvmTokenFilterPredicate } from "./getBridgeableSvmTokenFilterPredicate";
import { EnrichedToken } from "./ChainTokenSelectorModal";
import { solana } from "../../../../constants/chains/configs";

describe("getBridgeableSvmTokenFilterPredicate", () => {
  it("should filter out solana tokens that are not bridgeable", () => {
    const otherToken = {
      chainId: solana.chainId,
    } as EnrichedToken;
    const predicate = getBridgeableSvmTokenFilterPredicate(false, otherToken);
    const tokens = [
      { symbol: "XYZ" },
      { symbol: "USDC" },
      { symbol: "USDzC" },
      { symbol: "USDH" },
      { symbol: "USDH-SPOT" },
    ] as EnrichedToken[];
    expect(tokens.filter(predicate)).toEqual([
      { symbol: "USDC" },
      { symbol: "USDzC" },
      { symbol: "USDH" },
      { symbol: "USDH-SPOT" },
    ]);
  });
});
