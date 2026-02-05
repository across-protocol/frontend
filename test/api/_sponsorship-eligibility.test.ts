import { beforeEach, describe, expect, test, vi } from "vitest";
import { utils } from "ethers";
import {
  getSponsorshipEligibilityPreChecks,
  assertSponsoredAmountCanBeCovered,
  isSponsoredSwapSlippageTolerable,
  hasDonationBoxEnoughFunds,
  SponsoredSwapSlippageTooHighError,
  SponsoredDonationBoxFundsInsufficientError,
  SPONSORED_GLOBAL_DAILY_LIMIT_PER_FINAL_TOKEN,
  SPONSORED_USER_DAILY_LIMIT_PER_FINAL_TOKEN,
  SPONSORED_ACCOUNT_CREATION_DAILY_LIMIT,
  SPONSORED_SWAP_SLIPPAGE_TOLERANCE,
  MaxBpsToSponsorTooHighError,
} from "../../api/_sponsorship-eligibility";
import { Token } from "../../api/_dexes/types";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../api/_constants";
import * as indexerApi from "../../api/_indexer-api";
import * as balance from "../../api/_balance";

vi.mock("../../api/_env", async (importOriginal) => ({
  ...(await importOriginal()),
  getEnvs: vi.fn().mockReturnValue({
    SPONSORED_GLOBAL_DAILY_LIMIT_PER_FINAL_TOKEN: JSON.stringify({
      USDC: "100",
      USDH: "100",
    }),
    SPONSORED_USER_DAILY_LIMIT_PER_FINAL_TOKEN: JSON.stringify({
      USDC: "100",
      USDH: "100",
    }),
    SPONSORED_ACCOUNT_CREATION_DAILY_LIMIT: 10,
    SPONSORED_SWAP_SLIPPAGE_TOLERANCE: 0.5,
  }),
}));

vi.mock("../../api/_logger", () => ({
  getLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe("api/_sponsorship-eligibility", () => {
  const hyperCoreUSDH: Token = {
    ...TOKEN_SYMBOLS_MAP["USDH-SPOT"],
    address: TOKEN_SYMBOLS_MAP["USDH-SPOT"].addresses[CHAIN_IDs.HYPERCORE],
    chainId: CHAIN_IDs.HYPERCORE,
  };
  const arbitrumUSDC: Token = {
    ...TOKEN_SYMBOLS_MAP.USDC,
    address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
    chainId: CHAIN_IDs.ARBITRUM,
  };
  const mockRecipient = "0x0000000000000000000000000000000000000001";

  describe("Constants", () => {
    test("SPONSORED_GLOBAL_DAILY_LIMIT_PER_FINAL_TOKEN should have default values", () => {
      expect(SPONSORED_GLOBAL_DAILY_LIMIT_PER_FINAL_TOKEN).toBeDefined();
      expect(SPONSORED_GLOBAL_DAILY_LIMIT_PER_FINAL_TOKEN.USDC).toBeDefined();
      expect(SPONSORED_GLOBAL_DAILY_LIMIT_PER_FINAL_TOKEN.USDH).toBeDefined();
    });

    test("SPONSORED_USER_DAILY_LIMIT_PER_FINAL_TOKEN should have default values", () => {
      expect(SPONSORED_USER_DAILY_LIMIT_PER_FINAL_TOKEN).toBeDefined();
      expect(SPONSORED_USER_DAILY_LIMIT_PER_FINAL_TOKEN.USDC).toBeDefined();
      expect(SPONSORED_USER_DAILY_LIMIT_PER_FINAL_TOKEN.USDH).toBeDefined();
    });

    test("SPONSORED_ACCOUNT_CREATION_DAILY_LIMIT should have default value", () => {
      expect(SPONSORED_ACCOUNT_CREATION_DAILY_LIMIT).toBeDefined();
    });

    test("SPONSORED_SWAP_SLIPPAGE_TOLERANCE should have default value", () => {
      expect(SPONSORED_SWAP_SLIPPAGE_TOLERANCE).toBeDefined();
    });
  });

  describe("#isSponsoredSwapSlippageTolerable()", () => {
    test("should return true when slippage is below tolerance", () => {
      expect(isSponsoredSwapSlippageTolerable(1)).toBe(true);
    });

    test("should return false when slippage exceeds tolerance", () => {
      expect(isSponsoredSwapSlippageTolerable(101)).toBe(false);
    });
  });

  describe("#getSponsorshipEligibilityPreChecks()", () => {
    const mockSponsorshipsData = {
      totalSponsorships: [
        {
          chainId: CHAIN_IDs.HYPEREVM,
          finalTokens: [
            {
              tokenAddress:
                TOKEN_SYMBOLS_MAP.USDH.addresses[CHAIN_IDs.HYPEREVM],
              evmAmountSponsored: "0",
            },
          ],
        },
      ],
      userSponsorships: [
        {
          finalRecipient: mockRecipient,
          sponsorships: [
            {
              chainId: CHAIN_IDs.HYPEREVM,
              finalTokens: [
                {
                  tokenAddress:
                    TOKEN_SYMBOLS_MAP.USDH.addresses[CHAIN_IDs.HYPEREVM],
                  evmAmountSponsored: "0",
                },
              ],
            },
          ],
        },
      ],
      accountActivations: [{ finalRecipient: mockRecipient }],
    };

    beforeEach(() => {
      vi.clearAllMocks();
      vi.spyOn(indexerApi, "getSponsorshipsFromIndexer").mockResolvedValue(
        mockSponsorshipsData
      );
    });

    test("should return false for isWithinInputAmountLimit when input amount exceeds limit", async () => {
      const result = await getSponsorshipEligibilityPreChecks({
        inputToken: arbitrumUSDC,
        amount: utils.parseUnits("2000000", arbitrumUSDC.decimals), // 2M > 1M limit
        outputToken: hyperCoreUSDH,
        recipient: mockRecipient,
        amountType: "exactInput",
      });

      expect(result).toBeDefined();
      expect(result?.isWithinInputAmountLimit).toBe(false);
    });

    test("should return falsey input amount limit when token pair has no limit defined", async () => {
      const arbitrumWETH: Token = {
        ...TOKEN_SYMBOLS_MAP.WETH,
        address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.ARBITRUM],
        chainId: CHAIN_IDs.ARBITRUM,
      };

      const result = await getSponsorshipEligibilityPreChecks({
        inputToken: arbitrumWETH,
        amount: utils.parseUnits("1", arbitrumWETH.decimals),
        outputToken: hyperCoreUSDH,
        recipient: mockRecipient,
        amountType: "exactInput",
      });

      expect(result).toBeDefined();
      expect(result?.isWithinInputAmountLimit).toBeFalsy();
      expect(result?.isEligibleTokenPair).toBe(false);
    });

    test("should return isEligibleTokenPair false for non-eligible token pair", async () => {
      const hyperCoreUSDCSpot: Token = {
        ...TOKEN_SYMBOLS_MAP["USDC-SPOT"],
        address: TOKEN_SYMBOLS_MAP["USDC-SPOT"].addresses[CHAIN_IDs.HYPERCORE],
        chainId: CHAIN_IDs.HYPERCORE,
      };

      const result = await getSponsorshipEligibilityPreChecks({
        inputToken: arbitrumUSDC,
        amount: utils.parseUnits("100", arbitrumUSDC.decimals),
        outputToken: hyperCoreUSDCSpot, // USDC → USDC-SPOT is not in SPONSORSHIP_ELIGIBLE_TOKEN_PAIRS
        recipient: mockRecipient,
        amountType: "exactInput",
      });

      expect(result).toBeDefined();
      expect(result?.isEligibleTokenPair).toBe(false);
      expect(result?.isWithinInputAmountLimit).toBe(true);
    });

    test("should return all checks passing when within limits", async () => {
      vi.spyOn(indexerApi, "getSponsorshipsFromIndexer").mockResolvedValue(
        mockSponsorshipsData
      );

      const result = await getSponsorshipEligibilityPreChecks({
        inputToken: arbitrumUSDC,
        amount: utils.parseUnits("100", arbitrumUSDC.decimals),
        outputToken: hyperCoreUSDH,
        recipient: mockRecipient,
        amountType: "exactInput",
      });

      expect(result).toBeDefined();
      expect(result?.isWithinGlobalDailyLimit).toBe(true);
      expect(result?.isWithinUserDailyLimit).toBe(true);
      expect(result?.isWithinAccountCreationDailyLimit).toBe(true);
    });

    test("should return false for isWithinGlobalDailyLimit when global limit exceeded", async () => {
      const exceededData = {
        ...mockSponsorshipsData,
        totalSponsorships: [
          {
            chainId: CHAIN_IDs.HYPEREVM,
            finalTokens: [
              {
                tokenAddress:
                  TOKEN_SYMBOLS_MAP.USDH.addresses[CHAIN_IDs.HYPEREVM],
                evmAmountSponsored: utils
                  .parseUnits("1000", TOKEN_SYMBOLS_MAP.USDC.decimals)
                  .toString(), // Exceeds 100 limit
              },
            ],
          },
        ],
      };

      vi.spyOn(indexerApi, "getSponsorshipsFromIndexer").mockResolvedValue(
        exceededData
      );

      const result = await getSponsorshipEligibilityPreChecks({
        inputToken: arbitrumUSDC,
        amount: utils.parseUnits("100", arbitrumUSDC.decimals),
        outputToken: hyperCoreUSDH,
        recipient: mockRecipient,
        amountType: "exactInput",
      });

      expect(result).toBeDefined();
      expect(result?.isWithinGlobalDailyLimit).toBe(false);
    });

    test("should return false for isWithinUserDailyLimit when user limit exceeded", async () => {
      const exceededData = {
        ...mockSponsorshipsData,
        userSponsorships: [
          {
            finalRecipient: mockRecipient,
            sponsorships: [
              {
                chainId: CHAIN_IDs.HYPEREVM,
                finalTokens: [
                  {
                    tokenAddress:
                      TOKEN_SYMBOLS_MAP.USDH.addresses[CHAIN_IDs.HYPEREVM],
                    evmAmountSponsored: utils
                      .parseUnits("100", TOKEN_SYMBOLS_MAP.USDC.decimals)
                      .toString(), // Exceeds 10 limit
                  },
                ],
              },
            ],
          },
        ],
      };

      vi.spyOn(indexerApi, "getSponsorshipsFromIndexer").mockResolvedValue(
        exceededData
      );

      const result = await getSponsorshipEligibilityPreChecks({
        inputToken: arbitrumUSDC,
        amount: utils.parseUnits("100", arbitrumUSDC.decimals),
        outputToken: hyperCoreUSDH,
        recipient: mockRecipient,
        amountType: "exactInput",
      });

      expect(result).toBeDefined();
      expect(result?.isWithinUserDailyLimit).toBe(false);
    });

    test("should return false for isWithinAccountCreationDailyLimit when limit exceeded", async () => {
      const exceededData = {
        ...mockSponsorshipsData,
        accountActivations: Array(15).fill({ finalRecipient: mockRecipient }), // 15 > 10 limit
      };

      vi.spyOn(indexerApi, "getSponsorshipsFromIndexer").mockResolvedValue(
        exceededData
      );

      const result = await getSponsorshipEligibilityPreChecks({
        inputToken: arbitrumUSDC,
        amount: utils.parseUnits("100", arbitrumUSDC.decimals),
        outputToken: hyperCoreUSDH,
        recipient: mockRecipient,
        amountType: "exactInput",
      });

      expect(result).toBeDefined();
      expect(result?.isWithinAccountCreationDailyLimit).toBe(false);
    });
  });

  describe("#hasDonationBoxEnoughFunds()", () => {
    const inputAmount = utils.parseUnits("100", arbitrumUSDC.decimals);
    const maxBpsToSponsor = 100; // 1%

    beforeEach(() => {
      vi.clearAllMocks();
    });

    test("should return true when donation box has sufficient funds", async () => {
      // maxSponsoredAmount = 100 * 100 / 10000 = 1 USDC
      vi.spyOn(balance, "getCachedTokenBalance").mockResolvedValue(
        utils.parseUnits("10", TOKEN_SYMBOLS_MAP.USDH.decimals)
      ); // 10 USDC

      const result = await hasDonationBoxEnoughFunds({
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDH,
        maxBpsToSponsor,
        inputAmount,
      });

      expect(result).toBe(true);
    });

    test("should return false when donation box has insufficient funds", async () => {
      // maxSponsoredAmount = 100 * 100 / 10000 = 1 USDC
      vi.spyOn(balance, "getCachedTokenBalance").mockResolvedValue(
        utils.parseUnits("0.5", TOKEN_SYMBOLS_MAP.USDH.decimals)
      ); // 0.5 USDC

      const result = await hasDonationBoxEnoughFunds({
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDH,
        maxBpsToSponsor,
        inputAmount,
      });

      expect(result).toBe(false);
    });

    test("should return true when donation box balance equals max sponsored amount", async () => {
      // maxSponsoredAmount = 100 * 100 / 10000 = 1 USDC
      vi.spyOn(balance, "getCachedTokenBalance").mockResolvedValue(
        utils.parseUnits("1", TOKEN_SYMBOLS_MAP.USDC.decimals)
      ); // 1 USDC

      const result = await hasDonationBoxEnoughFunds({
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDH,
        maxBpsToSponsor,
        inputAmount,
      });

      expect(result).toBe(true);
    });

    test("should handle higher maxBpsToSponsor correctly", async () => {
      const highBps = 500; // 5%
      // maxSponsoredAmount = 100 * 500 / 10000 = 5 USDC
      vi.spyOn(balance, "getCachedTokenBalance").mockResolvedValue(
        utils.parseUnits("3", TOKEN_SYMBOLS_MAP.USDH.decimals)
      ); // 3 USDC

      const result = await hasDonationBoxEnoughFunds({
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDH,
        maxBpsToSponsor: highBps,
        inputAmount,
      });

      expect(result).toBe(false);
    });
  });

  describe("#assertSponsoredAmountCanBeCovered()", () => {
    const inputAmount = utils.parseUnits("100", arbitrumUSDC.decimals);
    const maxBpsToSponsor = 1; // 0.01%

    beforeEach(() => {
      vi.clearAllMocks();
    });

    test("should return true when slippage is tolerable and funds are sufficient", async () => {
      vi.spyOn(balance, "getCachedTokenBalance").mockResolvedValue(
        utils.parseUnits("10", TOKEN_SYMBOLS_MAP.USDH.decimals)
      );

      const result = await assertSponsoredAmountCanBeCovered({
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDH,
        maxBpsToSponsor,
        swapSlippageBps: 0.1,
        inputAmount,
      });

      expect(result).toBe(true);
    });

    test("should throw SponsoredSwapSlippageToHighError when slippage exceeds tolerance", async () => {
      vi.spyOn(balance, "getCachedTokenBalance").mockResolvedValue(
        utils.parseUnits("10", TOKEN_SYMBOLS_MAP.USDH.decimals)
      );

      await expect(
        assertSponsoredAmountCanBeCovered({
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDH,
          maxBpsToSponsor,
          swapSlippageBps: 101, // Exceeds 1% tolerance
          inputAmount,
        })
      ).rejects.toThrow(SponsoredSwapSlippageTooHighError);
    });

    test("should throw SponsoredDonationBoxFundsInsufficientError when funds are insufficient", async () => {
      vi.spyOn(balance, "getCachedTokenBalance").mockResolvedValue(
        utils.parseUnits("0.0001", TOKEN_SYMBOLS_MAP.USDH.decimals)
      ); // Very low balance

      await expect(
        assertSponsoredAmountCanBeCovered({
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDH,
          maxBpsToSponsor,
          swapSlippageBps: 1, // Within tolerance
          inputAmount,
        })
      ).rejects.toThrow(SponsoredDonationBoxFundsInsufficientError);
    });

    test("should pass with zero slippage", async () => {
      vi.spyOn(balance, "getCachedTokenBalance").mockResolvedValue(
        utils.parseUnits("10", TOKEN_SYMBOLS_MAP.USDH.decimals)
      );

      const result = await assertSponsoredAmountCanBeCovered({
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDH,
        maxBpsToSponsor,
        swapSlippageBps: 0,
        inputAmount,
      });

      expect(result).toBe(true);
    });

    test("should pass with slippage at tolerance boundary", async () => {
      vi.spyOn(balance, "getCachedTokenBalance").mockResolvedValue(
        utils.parseUnits("10", TOKEN_SYMBOLS_MAP.USDH.decimals)
      );

      const result = await assertSponsoredAmountCanBeCovered({
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDH,
        maxBpsToSponsor,
        swapSlippageBps: SPONSORED_SWAP_SLIPPAGE_TOLERANCE,
        inputAmount,
      });

      expect(result).toBe(true);
    });

    test("should throw MaxBpsToSponsorTooHighError when maxBpsToSponsor exceeds limit", async () => {
      await expect(
        assertSponsoredAmountCanBeCovered({
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDH,
          maxBpsToSponsor: 101,
          swapSlippageBps: 0,
          inputAmount,
        })
      ).rejects.toThrow(MaxBpsToSponsorTooHighError);
    });
  });
});
