import { BigNumber } from "ethers";
import {
  assertSufficientBalanceOnHyperEvm,
  assertAccountExistsOnHyperCore,
  getHyperEvmChainId,
  getBridgeableOutputToken,
  isToHyperCore,
  getDepositRecipient,
  getDepositMessage,
} from "../../../../api/_bridges/sponsored-intent/utils/common";
import { getCachedTokenBalance } from "../../../../api/_balance";
import { accountExistsOnHyperCore } from "../../../../api/_hypercore";
import {
  getFullRelayers,
  getTransferRestrictedRelayers,
} from "../../../../api/_relayer-address";
import { CHAIN_IDs } from "../../../../api/_constants";
import {
  BRIDGEABLE_OUTPUT_TOKEN_PER_OUTPUT_TOKEN,
  HYPERLIQUID_DEPOSIT_HANDLER_ADDRESS,
} from "../../../../api/_bridges/sponsored-intent/utils/constants";
import { USDC_ON_OPTIMISM, USDH_ON_HYPEREVM, USDH_ON_HYPERCORE } from "./utils";

jest.mock("../../../../api/_balance");
jest.mock("../../../../api/_hypercore");
jest.mock("../../../../api/_relayer-address");

describe("api/_bridges/sponsored-intent/utils/common", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getHyperEvmChainId", () => {
    it("should return HYPEREVM for HYPEREVM destination", () => {
      expect(getHyperEvmChainId(CHAIN_IDs.HYPEREVM)).toBe(CHAIN_IDs.HYPEREVM);
    });
    it("should return HYPEREVM for HYPERCORE destination", () => {
      expect(getHyperEvmChainId(CHAIN_IDs.HYPERCORE)).toBe(CHAIN_IDs.HYPEREVM);
    });
    it("should return HYPEREVM_TESTNET for other destinations (assuming testnet)", () => {
      expect(getHyperEvmChainId(123)).toBe(CHAIN_IDs.HYPEREVM_TESTNET);
    });
  });

  describe("getBridgeableOutputToken", () => {
    it("should return bridgeable token for USDH", () => {
      expect(getBridgeableOutputToken(USDH_ON_HYPERCORE)).toBe(
        BRIDGEABLE_OUTPUT_TOKEN_PER_OUTPUT_TOKEN.USDH
      );
    });
  });

  describe("isToHyperCore", () => {
    it("should return true for HyperCore chainId", () => {
      expect(isToHyperCore(USDH_ON_HYPERCORE)).toBe(true);
    });
    it("should return false for other chainId", () => {
      expect(isToHyperCore(USDH_ON_HYPEREVM)).toBe(false);
    });
  });

  describe("assertSufficientBalanceOnHyperEvm", () => {
    const inputToken = USDC_ON_OPTIMISM;
    const outputToken = USDH_ON_HYPEREVM;

    beforeEach(() => {
      (getFullRelayers as jest.Mock).mockReturnValue(["0xRelayer1"]);
      (getTransferRestrictedRelayers as jest.Mock).mockReturnValue([
        "0xRelayer2",
      ]);
    });

    it("should resolve if balance is sufficient", async () => {
      // Max balance on relayer: 1000. Input amount: 500.
      (getCachedTokenBalance as jest.Mock).mockResolvedValue(
        BigNumber.from("1000000000")
      );

      await expect(
        assertSufficientBalanceOnHyperEvm({
          amountHyperEvm: BigNumber.from("500000000"),
          inputToken,
          outputToken,
        })
      ).resolves.not.toThrow();
    });

    it("should throw if balance is insufficient", async () => {
      // Max balance: 100. Input: 500.
      (getCachedTokenBalance as jest.Mock).mockResolvedValue(
        BigNumber.from("100000000")
      );

      await expect(
        assertSufficientBalanceOnHyperEvm({
          amountHyperEvm: BigNumber.from("500000000"),
          inputToken,
          outputToken,
        })
      ).rejects.toThrow("Amount exceeds max. deposit limit");
    });
  });

  describe("assertAccountExistsOnHyperCore", () => {
    it("should resolve if account exists", async () => {
      (accountExistsOnHyperCore as jest.Mock).mockResolvedValue(true);
      await expect(
        assertAccountExistsOnHyperCore({
          account: "0x123",
          errorMessagePrefix: "Error",
        })
      ).resolves.not.toThrow();
    });

    it("should throw if account does not exist", async () => {
      (accountExistsOnHyperCore as jest.Mock).mockResolvedValue(false);
      await expect(
        assertAccountExistsOnHyperCore({
          account: "0x123",
          errorMessagePrefix: "Error",
        })
      ).rejects.toThrow("Error: Account 0x123 is not initialized on HyperCore");
    });
  });

  describe("getDepositRecipient", () => {
    it("should return HYPERLIQUID_DEPOSIT_HANDLER_ADDRESS if to HyperCore", () => {
      const recipient = "0xUser";
      const outputToken = USDH_ON_HYPERCORE;
      const res = getDepositRecipient({ outputToken, recipient });
      expect(res).toBe(HYPERLIQUID_DEPOSIT_HANDLER_ADDRESS);
    });

    it("should return recipient if not to HyperCore", () => {
      const recipient = "0xUser";
      const outputToken = USDH_ON_HYPEREVM;
      expect(getDepositRecipient({ outputToken, recipient })).toBe(recipient);
    });
  });

  describe("getDepositMessage", () => {
    it("should return encoded address if to HyperCore", () => {
      const recipient = "0x0000000000000000000000000000000000000123";
      const outputToken = USDH_ON_HYPERCORE;
      const res = getDepositMessage({ outputToken, recipient });
      expect(res).toContain(recipient.slice(2).toLowerCase());
    });

    it("should return '0x' if not to HyperCore", () => {
      const recipient = "0xUser";
      const outputToken = USDH_ON_HYPEREVM;
      expect(getDepositMessage({ outputToken, recipient })).toBe("0x");
    });
  });
});
