import { utils } from "ethers";
import {
  getSponsorshipEligibilityPreChecks,
  assertSponsoredAmountCanBeCovered,
  isSponsoredSwapSlippageTolerable,
  hasDonationBoxEnoughFunds,
  SponsoredSwapSlippageToHighError,
  SponsoredDonationBoxFundsInsufficientError,
  SPONSORED_GLOBAL_DAILY_LIMIT_PER_FINAL_TOKEN,
  SPONSORED_USER_DAILY_LIMIT_PER_FINAL_TOKEN,
  SPONSORED_ACCOUNT_CREATION_DAILY_LIMIT,
  SPONSORED_SWAP_SLIPPAGE_TOLERANCE,
} from "../../api/_sponsorship-eligibility";
import { Token } from "../../api/_dexes/types";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../api/_constants";
import * as indexerApi from "../../api/_indexer-api";
import * as balance from "../../api/_balance";

jest.mock("../../api/_env", () => ({
  ...jest.requireActual("../../api/_env"),
  getEnvs: jest.fn().mockReturnValue({}),
}));

// Mock logger for clean output
jest.mock("../../api/_logger", () => ({
  getLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

describe("api/_sponsorship-eligibility", () => {
  const hyperCoreUSDC: Token = {
    ...TOKEN_SYMBOLS_MAP.USDC,
    address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPERCORE],
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
      expect(SPONSORED_ACCOUNT_CREATION_DAILY_LIMIT).toBe(10);
    });

    test("SPONSORED_SWAP_SLIPPAGE_TOLERANCE should have default value", () => {
      expect(SPONSORED_SWAP_SLIPPAGE_TOLERANCE).toBe(0.5);
    });
  });

  describe("#isSponsoredSwapSlippageTolerable()", () => {
    test("should return true when slippage is below tolerance", () => {
      expect(isSponsoredSwapSlippageTolerable(0.1)).toBe(true);
    });

    test("should return false when slippage exceeds tolerance", () => {
      expect(isSponsoredSwapSlippageTolerable(5)).toBe(false);
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
                TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPEREVM],
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
                    TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPEREVM],
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
      jest.clearAllMocks();
    });

    test("should return undefined when totalSponsorships data is missing", async () => {
      jest.spyOn(indexerApi, "getSponsorshipsFromIndexer").mockResolvedValue({
        totalSponsorships: [],
        userSponsorships: mockSponsorshipsData.userSponsorships,
        accountActivations: mockSponsorshipsData.accountActivations,
      });

      const result = await getSponsorshipEligibilityPreChecks({
        outputToken: hyperCoreUSDC,
        recipient: mockRecipient,
      });

      expect(result).toBeUndefined();
    });

    test("should return all checks passing when within limits", async () => {
      jest
        .spyOn(indexerApi, "getSponsorshipsFromIndexer")
        .mockResolvedValue(mockSponsorshipsData);

      const result = await getSponsorshipEligibilityPreChecks({
        outputToken: hyperCoreUSDC,
        recipient: mockRecipient,
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
                  TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPEREVM],
                evmAmountSponsored: utils
                  .parseUnits("1000", TOKEN_SYMBOLS_MAP.USDC.decimals)
                  .toString(), // Exceeds 100 limit
              },
            ],
          },
        ],
      };

      jest
        .spyOn(indexerApi, "getSponsorshipsFromIndexer")
        .mockResolvedValue(exceededData);

      const result = await getSponsorshipEligibilityPreChecks({
        outputToken: hyperCoreUSDC,
        recipient: mockRecipient,
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
                      TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPEREVM],
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

      jest
        .spyOn(indexerApi, "getSponsorshipsFromIndexer")
        .mockResolvedValue(exceededData);

      const result = await getSponsorshipEligibilityPreChecks({
        outputToken: hyperCoreUSDC,
        recipient: mockRecipient,
      });

      expect(result).toBeDefined();
      expect(result?.isWithinUserDailyLimit).toBe(false);
    });

    test("should return false for isWithinAccountCreationDailyLimit when limit exceeded", async () => {
      const exceededData = {
        ...mockSponsorshipsData,
        accountActivations: Array(15).fill({ finalRecipient: mockRecipient }), // 15 > 10 limit
      };

      jest
        .spyOn(indexerApi, "getSponsorshipsFromIndexer")
        .mockResolvedValue(exceededData);

      const result = await getSponsorshipEligibilityPreChecks({
        outputToken: hyperCoreUSDC,
        recipient: mockRecipient,
      });

      expect(result).toBeDefined();
      expect(result?.isWithinAccountCreationDailyLimit).toBe(false);
    });
  });

  describe("#hasDonationBoxEnoughFunds()", () => {
    const inputAmount = utils.parseUnits("100", arbitrumUSDC.decimals);
    const maxBpsToSponsor = 100; // 1%

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("should return true when donation box has sufficient funds", async () => {
      // maxSponsoredAmount = 100 * 100 / 10000 = 1 USDC
      jest
        .spyOn(balance, "getCachedTokenBalance")
        .mockResolvedValue(
          utils.parseUnits("10", TOKEN_SYMBOLS_MAP.USDC.decimals)
        ); // 10 USDC

      const result = await hasDonationBoxEnoughFunds({
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDC,
        maxBpsToSponsor,
        inputAmount,
      });

      expect(result).toBe(true);
    });

    test("should return false when donation box has insufficient funds", async () => {
      // maxSponsoredAmount = 100 * 100 / 10000 = 1 USDC
      jest
        .spyOn(balance, "getCachedTokenBalance")
        .mockResolvedValue(
          utils.parseUnits("0.5", TOKEN_SYMBOLS_MAP.USDC.decimals)
        ); // 0.5 USDC

      const result = await hasDonationBoxEnoughFunds({
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDC,
        maxBpsToSponsor,
        inputAmount,
      });

      expect(result).toBe(false);
    });

    test("should return true when donation box balance equals max sponsored amount", async () => {
      // maxSponsoredAmount = 100 * 100 / 10000 = 1 USDC
      jest
        .spyOn(balance, "getCachedTokenBalance")
        .mockResolvedValue(
          utils.parseUnits("1", TOKEN_SYMBOLS_MAP.USDC.decimals)
        ); // 1 USDC

      const result = await hasDonationBoxEnoughFunds({
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDC,
        maxBpsToSponsor,
        inputAmount,
      });

      expect(result).toBe(true);
    });

    test("should handle higher maxBpsToSponsor correctly", async () => {
      const highBps = 500; // 5%
      // maxSponsoredAmount = 100 * 500 / 10000 = 5 USDC
      jest
        .spyOn(balance, "getCachedTokenBalance")
        .mockResolvedValue(
          utils.parseUnits("3", TOKEN_SYMBOLS_MAP.USDC.decimals)
        ); // 3 USDC

      const result = await hasDonationBoxEnoughFunds({
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDC,
        maxBpsToSponsor: highBps,
        inputAmount,
      });

      expect(result).toBe(false);
    });
  });

  describe("#assertSponsoredAmountCanBeCovered()", () => {
    const inputAmount = utils.parseUnits("100", arbitrumUSDC.decimals);
    const maxBpsToSponsor = 100; // 1%

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("should return true when slippage is tolerable and funds are sufficient", async () => {
      jest
        .spyOn(balance, "getCachedTokenBalance")
        .mockResolvedValue(
          utils.parseUnits("10", TOKEN_SYMBOLS_MAP.USDC.decimals)
        );

      const result = await assertSponsoredAmountCanBeCovered({
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDC,
        maxBpsToSponsor,
        swapSlippageBps: 0.1,
        inputAmount,
      });

      expect(result).toBe(true);
    });

    test("should throw SponsoredSwapSlippageToHighError when slippage exceeds tolerance", async () => {
      jest
        .spyOn(balance, "getCachedTokenBalance")
        .mockResolvedValue(
          utils.parseUnits("10", TOKEN_SYMBOLS_MAP.USDC.decimals)
        );

      await expect(
        assertSponsoredAmountCanBeCovered({
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDC,
          maxBpsToSponsor,
          swapSlippageBps: 1.0, // Exceeds 0.5 tolerance
          inputAmount,
        })
      ).rejects.toThrow(SponsoredSwapSlippageToHighError);
    });

    test("should throw SponsoredDonationBoxFundsInsufficientError when funds are insufficient", async () => {
      jest
        .spyOn(balance, "getCachedTokenBalance")
        .mockResolvedValue(
          utils.parseUnits("0.1", TOKEN_SYMBOLS_MAP.USDC.decimals)
        ); // Very low balance

      await expect(
        assertSponsoredAmountCanBeCovered({
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDC,
          maxBpsToSponsor,
          swapSlippageBps: 0.1, // Within tolerance
          inputAmount,
        })
      ).rejects.toThrow(SponsoredDonationBoxFundsInsufficientError);
    });

    test("should pass with zero slippage", async () => {
      jest
        .spyOn(balance, "getCachedTokenBalance")
        .mockResolvedValue(
          utils.parseUnits("10", TOKEN_SYMBOLS_MAP.USDC.decimals)
        );

      const result = await assertSponsoredAmountCanBeCovered({
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDC,
        maxBpsToSponsor,
        swapSlippageBps: 0,
        inputAmount,
      });

      expect(result).toBe(true);
    });

    test("should pass with slippage at tolerance boundary", async () => {
      jest
        .spyOn(balance, "getCachedTokenBalance")
        .mockResolvedValue(
          utils.parseUnits("10", TOKEN_SYMBOLS_MAP.USDC.decimals)
        );

      const result = await assertSponsoredAmountCanBeCovered({
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDC,
        maxBpsToSponsor,
        swapSlippageBps: SPONSORED_SWAP_SLIPPAGE_TOLERANCE,
        inputAmount,
      });

      expect(result).toBe(true);
    });
  });
});
