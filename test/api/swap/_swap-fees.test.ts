import { BigNumber, utils, constants } from "ethers";
import { calculateSwapFees } from "../../../api/swap/_swap-fees";
import { TOKEN_SYMBOLS_MAP, CHAIN_IDs } from "../../../api/_constants";
import { FeeDetailsType } from "../../../api/_dexes/types";

describe("calculateSwapFees", () => {
  // Setup test tokens using constants
  const inputToken = {
    address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.MAINNET],
    symbol: TOKEN_SYMBOLS_MAP.USDC.symbol,
    decimals: TOKEN_SYMBOLS_MAP.USDC.decimals,
    chainId: CHAIN_IDs.MAINNET,
  };

  const outputToken = {
    address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
    symbol: TOKEN_SYMBOLS_MAP.USDC.symbol,
    decimals: TOKEN_SYMBOLS_MAP.USDC.decimals,
    chainId: CHAIN_IDs.OPTIMISM,
  };

  const bridgeFeeTokenNative = {
    address: constants.AddressZero,
    symbol: "ETH",
    decimals: 18,
    chainId: CHAIN_IDs.MAINNET,
  };

  // Input: 1000 USDC
  const inputAmount = utils.parseUnits("1000", inputToken.decimals);

  // Mock prices (1 USDC = $1, 1 ETH = $2000)
  const inputTokenPriceUsd = 1;
  const outputTokenPriceUsd = 1;
  const originNativePriceUsd = 2000;
  const destinationNativePriceUsd = 2000;
  const bridgeQuoteInputTokenPriceUsd = 1;
  const appFeeTokenPriceUsd = 1;

  // Origin gas: 100k gas * 50 gwei = 0.005 ETH
  const originTxGas = BigNumber.from(100000);
  const originTxGasPrice = utils.parseUnits("50", "gwei");

  // Mock logger
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const verifyFeeDetailsAddUp = (
    result: Awaited<ReturnType<typeof calculateSwapFees>>,
    viaAcross = true
  ) => {
    if (viaAcross) {
      expect(Number(result?.total.details?.bridge?.amountUsd ?? 0)).toEqual(
        Number(result?.total.details?.bridge?.details?.lp?.amountUsd ?? 0) +
          Number(
            result?.total.details?.bridge?.details?.relayerCapital?.amountUsd ??
              0
          ) +
          Number(
            result?.total.details?.bridge?.details?.destinationGas?.amountUsd ??
              0
          )
      );
    }
    expect(Number(result?.total.amountUsd ?? 0)).toEqual(
      Number(result?.total.details?.bridge?.amountUsd ?? 0) +
        Number(result?.total.details?.app?.amountUsd ?? 0) +
        Number(result?.total.details?.swapImpact?.amountUsd ?? 0)
    );
    expect(Number(result?.totalMax?.amountUsd ?? 0)).toEqual(
      Number(result?.totalMax?.details?.maxSwapImpact?.amountUsd ?? 0) +
        Number(result?.totalMax?.details?.app?.amountUsd ?? 0) +
        Number(result?.totalMax?.details?.bridge?.amountUsd ?? 0)
    );
  };

  test("should calculate fees for bridge-only route via across", async () => {
    // Bridge quote with fees
    const bridgeQuote = {
      inputToken,
      outputToken,
      inputAmount,
      outputAmount: utils.parseUnits("995", outputToken.decimals),
      minOutputAmount: utils.parseUnits("995", outputToken.decimals),
      estimatedFillTimeSec: 60,
      provider: "across" as const,
      suggestedFees: {} as any,
      fees: {
        amount: utils.parseUnits("5", inputToken.decimals),
        pct: utils.parseEther("0.005"),
        token: inputToken,
        details: {
          type: FeeDetailsType.ACROSS as const,
          relayerCapital: {
            amount: utils.parseUnits("1", inputToken.decimals),
            pct: utils.parseEther("0.001"),
            token: inputToken,
          },
          destinationGas: {
            amount: utils.parseUnits("2", inputToken.decimals),
            pct: utils.parseEther("0.002"),
            token: inputToken,
          },
          lp: {
            amount: utils.parseUnits("2", inputToken.decimals),
            pct: utils.parseEther("0.002"),
            token: inputToken,
          },
        },
      },
    };

    // Min output amount sans app fees: 995 USDC
    const minOutputAmountSansAppFees = utils.parseUnits(
      "995",
      outputToken.decimals
    );

    // Expected output amount sans app fees: 995 USDC
    const expectedOutputAmountSansAppFees = minOutputAmountSansAppFees;

    const result = await calculateSwapFees({
      inputAmount,
      bridgeQuote,
      originTxGas,
      originTxGasPrice,
      inputTokenPriceUsd,
      outputTokenPriceUsd,
      originNativePriceUsd,
      destinationNativePriceUsd,
      bridgeQuoteInputTokenPriceUsd,
      appFeeTokenPriceUsd,
      minOutputAmountSansAppFees,
      expectedOutputAmountSansAppFees,
      originChainId: CHAIN_IDs.MAINNET,
      destinationChainId: CHAIN_IDs.OPTIMISM,
      logger,
    });

    // Verify expected total fee structure
    expect(result?.total?.amount).toBeDefined();
    expect(result?.total?.amountUsd).toBe("5.0"); // 1000 - 995 = 5 USDC
    expect(result?.total?.pct).toBeDefined();
    expect(result?.total?.token).toEqual(inputToken);

    // Verify max total fee structure (same as expected total fee structure for no-swap)
    expect(result?.totalMax?.amount).toBeDefined();
    expect(result?.totalMax?.amountUsd).toBe("5.0"); // 1000 - 995 = 5 USDC
    expect(result?.totalMax?.pct).toBeDefined();
    expect(result?.totalMax?.token).toEqual(inputToken);

    // Verify origin gas fee
    // 0.005 ETH * $2000 = $10
    expect(result?.originGas?.amount).toEqual(
      originTxGas.mul(originTxGasPrice)
    );
    expect(result?.originGas?.amountUsd).toBe("10.0");
    expect(result?.originGas?.token.symbol).toBe("ETH");
    expect(result?.originGas?.pct).toBeUndefined(); // No pct for gas fees

    // Verify destination gas fee (2 USDC = $2)
    expect(
      result?.total.details?.bridge?.details?.destinationGas?.amountUsd
    ).toBe("2.0");
    expect(
      result?.total.details?.bridge?.details?.destinationGas?.token.symbol
    ).toBe("ETH");

    // Verify relayer capital fee (1 USDC = $1)
    expect(
      result?.total.details?.bridge?.details?.relayerCapital?.amount
    ).toEqual(bridgeQuote.fees.details.relayerCapital.amount);
    expect(
      result?.total.details?.bridge?.details?.relayerCapital?.amountUsd
    ).toBe("1.0");
    expect(
      result?.total.details?.bridge?.details?.relayerCapital?.token
    ).toEqual(inputToken);

    // Verify LP fee (2 USDC = $2)
    expect(result?.total.details?.bridge?.details?.lp?.amount).toEqual(
      bridgeQuote.fees.details.lp.amount
    );
    expect(result?.total.details?.bridge?.details?.lp?.amountUsd).toBe("2.0");
    expect(result?.total.details?.bridge?.details?.lp?.token).toEqual(
      inputToken
    );

    // Verify relayer total fee (5 USDC = $5)
    expect(result?.total.details?.bridge?.amount).toEqual(
      bridgeQuote.fees.amount
    );
    expect(result?.total.details?.bridge?.amountUsd).toBe("5.0");
    expect(result?.total.details?.bridge?.token).toEqual(inputToken);

    // Verify app fee (0 in this test)
    expect(result?.total.details?.app?.amount).toEqual(BigNumber.from(0));
    expect(result?.total.details?.app?.amountUsd).toBe("0.0");
    expect(result?.total.details?.app?.token).toEqual(outputToken);

    verifyFeeDetailsAddUp(result);
  });

  test("should calculate fees for bridge-only route via cctp", async () => {
    // Bridge quote with fees
    const bridgeQuote = {
      inputToken,
      outputToken,
      inputAmount,
      outputAmount: utils.parseUnits("999", outputToken.decimals),
      minOutputAmount: utils.parseUnits("999", outputToken.decimals),
      estimatedFillTimeSec: 60,
      provider: "across" as const,
      suggestedFees: {} as any,
      fees: {
        amount: utils.parseUnits("1", inputToken.decimals),
        pct: utils.parseEther("0.01"),
        token: inputToken,
      },
    };

    const minOutputAmountSansAppFees = utils.parseUnits(
      "999",
      outputToken.decimals
    );

    // Expected output amount sans app fees: 995 USDC
    const expectedOutputAmountSansAppFees = minOutputAmountSansAppFees;

    const result = await calculateSwapFees({
      inputAmount,
      bridgeQuote,
      originTxGas,
      originTxGasPrice,
      inputTokenPriceUsd,
      outputTokenPriceUsd,
      originNativePriceUsd,
      destinationNativePriceUsd,
      bridgeQuoteInputTokenPriceUsd,
      appFeeTokenPriceUsd,
      minOutputAmountSansAppFees,
      expectedOutputAmountSansAppFees,
      originChainId: CHAIN_IDs.MAINNET,
      destinationChainId: CHAIN_IDs.OPTIMISM,
      logger,
    });

    expect(result?.total.details?.bridge?.amount).toEqual(
      bridgeQuote.fees.amount
    );
    expect(result?.total.details?.bridge?.amountUsd).toBe("1.0");
    expect(result?.total.details?.bridge?.token).toEqual(inputToken);

    verifyFeeDetailsAddUp(result, false);
  });

  test("should calculate fees for bridge-only route via oft", async () => {
    // Bridge quote with fees
    const bridgeQuote = {
      inputToken,
      outputToken,
      inputAmount,
      outputAmount: utils.parseUnits("1000", outputToken.decimals),
      minOutputAmount: utils.parseUnits("1000", outputToken.decimals),
      estimatedFillTimeSec: 60,
      provider: "oft" as const,
      suggestedFees: {} as any,
      fees: {
        amount: utils.parseUnits("0.005", bridgeFeeTokenNative.decimals), // 0.005 ETH = $10
        pct: utils.parseEther("0.01"), // 10 / 1000 = 1%
        token: bridgeFeeTokenNative,
      },
    };

    const minOutputAmountSansAppFees = utils.parseUnits(
      "1000",
      outputToken.decimals
    );

    // Expected output amount sans app fees: 995 USDC
    const expectedOutputAmountSansAppFees = minOutputAmountSansAppFees;

    const result = await calculateSwapFees({
      inputAmount,
      bridgeQuote,
      originTxGas,
      originTxGasPrice,
      inputTokenPriceUsd,
      outputTokenPriceUsd,
      originNativePriceUsd,
      destinationNativePriceUsd,
      bridgeQuoteInputTokenPriceUsd,
      appFeeTokenPriceUsd,
      minOutputAmountSansAppFees,
      expectedOutputAmountSansAppFees,
      originChainId: CHAIN_IDs.MAINNET,
      destinationChainId: CHAIN_IDs.OPTIMISM,
      logger,
    });

    expect(result?.total.details?.bridge?.amount).toEqual(
      bridgeQuote.fees.amount
    );
    expect(result?.total.details?.bridge?.amountUsd).toBe("10.0");
    expect(result?.total.details?.bridge?.token).toEqual(bridgeFeeTokenNative);

    verifyFeeDetailsAddUp(result, false);
  });

  test("should calculate fees for swap route", async () => {
    const bridgeQuote = {
      inputToken,
      outputToken,
      inputAmount,
      outputAmount: utils.parseUnits("995", outputToken.decimals),
      minOutputAmount: utils.parseUnits("995", outputToken.decimals),
      estimatedFillTimeSec: 60,
      provider: "across" as const,
      suggestedFees: {} as any,
      fees: {
        amount: utils.parseUnits("4.5", inputToken.decimals),
        pct: utils.parseEther("0.0045"),
        token: inputToken,
        details: {
          type: FeeDetailsType.ACROSS as const,
          relayerCapital: {
            amount: utils.parseUnits("1", inputToken.decimals),
            pct: utils.parseEther("0.001"),
            token: inputToken,
          },
          destinationGas: {
            amount: utils.parseUnits("2", inputToken.decimals),
            pct: utils.parseEther("0.002"),
            token: inputToken,
          },
          lp: {
            amount: utils.parseUnits("1.5", inputToken.decimals),
            pct: utils.parseEther("0.0015"),
            token: inputToken,
          },
        },
      },
    };

    // Min output amount sans app fees: 995 USDC, i.e. 0.5 USDC slippage
    const minOutputAmountSansAppFees = utils.parseUnits(
      "995",
      outputToken.decimals
    );

    // Expected output amount sans app fees: 995.5 USDC, i.e. no-slippage
    const expectedOutputAmountSansAppFees = utils.parseUnits(
      "995.5",
      outputToken.decimals
    );

    const result = await calculateSwapFees({
      inputAmount,
      bridgeQuote,
      originTxGas,
      originTxGasPrice,
      inputTokenPriceUsd,
      outputTokenPriceUsd,
      originNativePriceUsd,
      destinationNativePriceUsd,
      bridgeQuoteInputTokenPriceUsd,
      appFeeTokenPriceUsd,
      minOutputAmountSansAppFees,
      expectedOutputAmountSansAppFees,
      originChainId: CHAIN_IDs.MAINNET,
      destinationChainId: CHAIN_IDs.OPTIMISM,
      logger,
    });

    // Verify expected total fee structure (without slippage)
    expect(result?.total?.amount).toBeDefined();
    expect(result?.total?.amountUsd).toBe("4.5"); // only relayer fees
    expect(result?.total?.pct).toBeDefined();
    expect(result?.total?.token).toEqual(inputToken);

    // Verify max total fee structure (with slippage)
    expect(result?.totalMax?.amount).toBeDefined();
    expect(result?.totalMax?.amountUsd).toBe("5.0"); // relayer fees + slippage
    expect(result?.totalMax?.pct).toBeDefined();
    expect(result?.totalMax?.token).toEqual(inputToken);

    // Verify swap impact
    expect(result?.total.details?.swapImpact?.amount).toBeDefined();
    expect(result?.total.details?.swapImpact?.amountUsd).toBe("0.0"); // no slippage
    expect(result?.total.details?.swapImpact?.pct).toBeDefined();
    expect(result?.total.details?.swapImpact?.token).toEqual(inputToken);

    // Verify max swap impact
    expect(result?.totalMax?.details?.maxSwapImpact?.amount).toBeDefined();
    expect(result?.totalMax?.details?.maxSwapImpact?.amountUsd).toBe("0.5"); // slippage
    expect(result?.totalMax?.details?.maxSwapImpact?.pct).toBeDefined();
    expect(result?.totalMax?.details?.maxSwapImpact?.token).toEqual(inputToken);

    verifyFeeDetailsAddUp(result);
  });

  test("should calculate fees for swap route where output > input", async () => {
    const bridgeQuote = {
      inputToken,
      outputToken,
      inputAmount,
      outputAmount: utils.parseUnits("1005", outputToken.decimals),
      minOutputAmount: utils.parseUnits("1004", outputToken.decimals),
      estimatedFillTimeSec: 60,
      provider: "across" as const,
      suggestedFees: {} as any,
      fees: {
        amount: utils.parseUnits("4.5", inputToken.decimals),
        pct: utils.parseEther("0.0045"),
        token: inputToken,
        details: {
          type: FeeDetailsType.ACROSS as const,
          relayerCapital: {
            amount: utils.parseUnits("1", inputToken.decimals),
            pct: utils.parseEther("0.001"),
            token: inputToken,
          },
          destinationGas: {
            amount: utils.parseUnits("2", inputToken.decimals),
            pct: utils.parseEther("0.002"),
            token: inputToken,
          },
          lp: {
            amount: utils.parseUnits("1.5", inputToken.decimals),
            pct: utils.parseEther("0.0015"),
            token: inputToken,
          },
        },
      },
    };

    // Min output amount sans app fees: 1004 USDC, positive price impact + slippage
    const minOutputAmountSansAppFees = utils.parseUnits(
      "1004",
      outputToken.decimals
    );

    // Expected output amount sans app fees: 1005 USDC, i.e. no-slippage
    const expectedOutputAmountSansAppFees = utils.parseUnits(
      "1005",
      outputToken.decimals
    );

    const result = await calculateSwapFees({
      inputAmount,
      bridgeQuote,
      originTxGas,
      originTxGasPrice,
      inputTokenPriceUsd,
      outputTokenPriceUsd,
      originNativePriceUsd,
      destinationNativePriceUsd,
      bridgeQuoteInputTokenPriceUsd,
      appFeeTokenPriceUsd,
      minOutputAmountSansAppFees,
      expectedOutputAmountSansAppFees,
      originChainId: CHAIN_IDs.MAINNET,
      destinationChainId: CHAIN_IDs.OPTIMISM,
      logger,
    });

    // Verify expected total fee structure (without slippage)
    expect(result?.total?.amount).toBeDefined();
    expect(result?.total?.amountUsd).toBe("-5.0");
    expect(result?.total?.pct).toBeDefined();
    expect(result?.total?.token).toEqual(inputToken);

    // Verify max total fee structure (with slippage)
    expect(result?.totalMax?.amount).toBeDefined();
    expect(result?.totalMax?.amountUsd).toBe("-4.0");
    expect(result?.totalMax?.pct).toBeDefined();
    expect(result?.totalMax?.token).toEqual(inputToken);

    // Verify swap impact
    expect(result?.total.details?.swapImpact?.amount).toBeDefined();
    expect(result?.total.details?.swapImpact?.amountUsd).toBe("-9.5"); // 4.5 (relayer fees) + 5 (price impact)
    expect(result?.total.details?.swapImpact?.pct).toBeDefined();
    expect(result?.total.details?.swapImpact?.token).toEqual(inputToken);

    // Verify max swap impact
    expect(result?.totalMax?.details?.maxSwapImpact?.amount).toBeDefined();
    expect(result?.totalMax?.details?.maxSwapImpact?.amountUsd).toBe("-8.5"); // 4.5 (relayer fees) + 4 (price impact)
    expect(result?.totalMax?.details?.maxSwapImpact?.pct).toBeDefined();
    expect(result?.totalMax?.details?.maxSwapImpact?.token).toEqual(inputToken);

    verifyFeeDetailsAddUp(result);
  });
});
