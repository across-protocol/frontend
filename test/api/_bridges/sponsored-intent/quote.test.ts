import { vi } from "vitest";
import { BigNumber } from "ethers";
import { getUsdhIntentQuote } from "../../../../api/_bridges/sponsored-intent/utils/quote";
import {
  getCachedTokenPrice,
  getRelayerFeeDetails,
} from "../../../../api/_utils";
import { getCachedTokenBalance } from "../../../../api/_balance";
import { USDC_ON_OPTIMISM, USDH_ON_HYPEREVM } from "./utils";

vi.mock("../../../../api/_utils", async (importOriginal) => ({
  ...(await importOriginal()),
  getCachedTokenPrice: vi.fn(),
  getRelayerFeeDetails: vi.fn(),
}));
vi.mock("../../../../api/_balance");
vi.mock("../../../../api/_hypercore");
vi.mock("../../../../api/_relayer-address", () => ({
  getFullRelayers: vi.fn().mockReturnValue(["0xRelayer"]),
  getTransferRestrictedRelayers: vi.fn().mockReturnValue(["0xRelayer2"]),
  getDefaultRelayerAddress: vi.fn().mockReturnValue("0xRelayer"),
}));

describe("api/_bridges/sponsored-intent/utils/quote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUsdhIntentQuote", () => {
    const inputToken = USDC_ON_OPTIMISM;
    const outputToken = USDH_ON_HYPEREVM;
    const params = {
      inputToken,
      outputToken,
      exactInputAmount: BigNumber.from("1000000"), // 1 USDC
      recipient: "0xRecipient",
    };

    it("should return valid quote", async () => {
      (getCachedTokenPrice as ReturnType<typeof vi.fn>).mockResolvedValue(1); // 1 USD
      (getCachedTokenBalance as ReturnType<typeof vi.fn>).mockResolvedValue(
        BigNumber.from("1000000000000")
      ); // Lots of balance
      (getRelayerFeeDetails as ReturnType<typeof vi.fn>).mockResolvedValue({
        gasFeeTotal: BigNumber.from("0"), // Cheap gas
        relayerFeeTotal: BigNumber.from("0"),
        relayerFeePct: BigNumber.from("0"),
      });

      const quote = await getUsdhIntentQuote(params);

      expect(quote.inputAmount).toEqual(params.exactInputAmount);
      expect(quote.fees.pct.toString()).toBe("0");
    });

    it("should throw if destination gas is too high", async () => {
      (getCachedTokenPrice as ReturnType<typeof vi.fn>).mockResolvedValue(1);
      (getCachedTokenBalance as ReturnType<typeof vi.fn>).mockResolvedValue(
        BigNumber.from("1000000000000")
      );
      // Return high gas cost
      (getRelayerFeeDetails as ReturnType<typeof vi.fn>).mockResolvedValue({
        gasFeeTotal: BigNumber.from("1000000000000000000"), // 1 ETH (assumed high value for test)
        relayerFeeTotal: BigNumber.from("0"),
        relayerFeePct: BigNumber.from("0"),
      });

      await expect(getUsdhIntentQuote(params)).rejects.toThrow(
        "Destination gas cost"
      );
    });
  });
});
