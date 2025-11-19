import { BigNumber } from "ethers";
import { getUsdhIntentQuote } from "../../../../api/_bridges/sponsored-intent/utils/quote";
import {
  getCachedTokenPrice,
  getRelayerFeeDetails,
} from "../../../../api/_utils";
import { getCachedTokenBalance } from "../../../../api/_balance";
import { USDC_ON_OPTIMISM, USDH_ON_HYPEREVM } from "./utils";

jest.mock("../../../../api/_utils", () => ({
  ...jest.requireActual("../../../../api/_utils"),
  getCachedTokenPrice: jest.fn(),
  getRelayerFeeDetails: jest.fn(),
}));
jest.mock("../../../../api/_balance");
jest.mock("../../../../api/_hypercore");
jest.mock("../../../../api/_relayer-address", () => ({
  getFullRelayers: jest.fn().mockReturnValue(["0xRelayer"]),
  getDefaultRelayerAddress: jest.fn().mockReturnValue("0xRelayer"),
}));

describe("api/_bridges/sponsored-intent/utils/quote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      (getCachedTokenPrice as jest.Mock).mockResolvedValue(1); // 1 USD
      (getCachedTokenBalance as jest.Mock).mockResolvedValue(
        BigNumber.from("1000000000000")
      ); // Lots of balance
      (getRelayerFeeDetails as jest.Mock).mockResolvedValue({
        gasFeeTotal: BigNumber.from("0"), // Cheap gas
        relayerFeeTotal: BigNumber.from("0"),
        relayerFeePct: BigNumber.from("0"),
      });

      const quote = await getUsdhIntentQuote(params);

      expect(quote.inputAmount).toEqual(params.exactInputAmount);
      expect(quote.fees.pct.toString()).toBe("0");
    });

    it("should throw if destination gas is too high", async () => {
      (getCachedTokenPrice as jest.Mock).mockResolvedValue(1);
      (getCachedTokenBalance as jest.Mock).mockResolvedValue(
        BigNumber.from("1000000000000")
      );
      // Return high gas cost
      (getRelayerFeeDetails as jest.Mock).mockResolvedValue({
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
