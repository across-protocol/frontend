import { BigNumber, utils, constants } from "ethers";
import {
  stringifyBigNumProps,
  calculateSwapFees,
} from "../../../api/swap/_utils";
import { TOKEN_SYMBOLS_MAP, CHAIN_IDs } from "../../../api/_constants";

describe("stringifyBigNumProps", () => {
  describe("BigNumber detection and conversion", () => {
    test("should convert standard BigNumber instances to strings", () => {
      const input = {
        amount: BigNumber.from(100),
        balance: BigNumber.from(200),
      };

      const result = stringifyBigNumProps(input);

      expect(result.amount).toBe("100");
      expect(result.balance).toBe("200");
    });

    test("should convert BigNumber objects with _isBigNumber property to strings", () => {
      // Simulate a BigNumber that lost its prototype or is from a different library (like in the allowance issue)
      const mockBigNumber = {
        _hex: "0x64", // 100 in hex
        _isBigNumber: true,
        toString: () => "100",
      };

      const input = {
        allowance: mockBigNumber,
        balance: BigNumber.from(200),
      };

      const result = stringifyBigNumProps(input);

      expect(result.allowance).toBe("100");
      expect(result.balance).toBe("200");
    });

    test("should handle mixed BigNumber types", () => {
      const standardBigNumber = BigNumber.from(100);
      const mockBigNumber = {
        _hex: "0xc8", // 200 in hex
        _isBigNumber: true,
        toString: () => "200",
      };

      const input = {
        standard: standardBigNumber,
        mock: mockBigNumber,
        regular: "string",
      };

      const result = stringifyBigNumProps(input);

      expect(result.standard).toBe("100");
      expect(result.mock).toBe("200");
      expect(result.regular).toBe("string");
    });
  });

  describe("nested object handling", () => {
    test("should handle nested objects with BigNumbers", () => {
      const input = {
        user: {
          balance: BigNumber.from(100),
          allowance: {
            actual: BigNumber.from(50),
            expected: BigNumber.from(100),
          },
        },
        token: "USDC",
      };

      const result = stringifyBigNumProps(input);

      expect(result.user.balance).toBe("100");
      expect(result.user.allowance.actual).toBe("50");
      expect(result.user.allowance.expected).toBe("100");
      expect(result.token).toBe("USDC");
    });

    test("should handle deeply nested BigNumbers", () => {
      const input = {
        level1: {
          level2: {
            level3: {
              amount: BigNumber.from(1000),
            },
          },
        },
      };

      const result = stringifyBigNumProps(input);

      expect(result.level1.level2.level3.amount).toBe("1000");
    });
  });

  describe("array handling", () => {
    test("should handle arrays with BigNumbers", () => {
      const input = {
        amounts: [
          BigNumber.from(100),
          BigNumber.from(200),
          BigNumber.from(300),
        ],
        names: ["Alice", "Bob", "Charlie"],
      };

      const result = stringifyBigNumProps(input);

      expect(result.amounts).toEqual(["100", "200", "300"]);
      expect(result.names).toEqual(["Alice", "Bob", "Charlie"]);
    });

    test("should handle nested arrays with BigNumbers", () => {
      const input = {
        transactions: [
          {
            amount: BigNumber.from(100),
            fee: BigNumber.from(5),
          },
          {
            amount: BigNumber.from(200),
            fee: BigNumber.from(10),
          },
        ],
      };

      const result = stringifyBigNumProps(input);

      expect(result.transactions[0].amount).toBe("100");
      expect(result.transactions[0].fee).toBe("5");
      expect(result.transactions[1].amount).toBe("200");
      expect(result.transactions[1].fee).toBe("10");
    });
  });

  describe("edge cases", () => {
    test("should handle null and undefined values", () => {
      const input = {
        amount: BigNumber.from(100),
        balance: null,
        allowance: undefined,
      };

      const result = stringifyBigNumProps(input);

      expect(result.amount).toBe("100");
      expect(result.balance).toBe(null);
      expect(result.allowance).toBe(undefined);
    });

    test("should handle empty objects and arrays", () => {
      const input = {
        emptyObj: {},
        emptyArr: [],
        amount: BigNumber.from(100),
      };

      const result = stringifyBigNumProps(input);

      expect(result.emptyObj).toEqual({});
      expect(result.emptyArr).toEqual([]);
      expect(result.amount).toBe("100");
    });

    test("should handle primitive values", () => {
      const input = {
        string: "hello",
        number: 42,
        boolean: true,
        amount: BigNumber.from(100),
      };

      const result = stringifyBigNumProps(input);

      expect(result.string).toBe("hello");
      expect(result.number).toBe(42);
      expect(result.boolean).toBe(true);
      expect(result.amount).toBe("100");
    });
  });

  describe("real-world scenarios", () => {
    test("should handle swap quote structure", () => {
      const input = {
        crossSwapType: "bridgeableToAny",
        amountType: "exactOutput",
        checks: {
          allowance: {
            token: "0x0000000000000000000000000000000000000000",
            spender: "0x89415a82d909a7238d69094C3Dd1dCC1aCbDa85C",
            actual: {
              _hex: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
              _isBigNumber: true,
              toString: () =>
                "115792089237316195423570985008687907853269984665640564039457584007913129639935",
            },
            expected: BigNumber.from(689821235147287),
          },
          balance: {
            token: "0x0000000000000000000000000000000000000000",
            actual: {
              _hex: "0x971f25b1e0245c",
              _isBigNumber: true,
              toString: () => "689821235147287",
            },
            expected: BigNumber.from(689821235147287),
          },
        },
      };

      const result = stringifyBigNumProps(input);

      // Verify all BigNumber values are converted to strings
      expect(typeof result.checks.allowance.actual).toBe("string");
      expect(typeof result.checks.allowance.expected).toBe("string");
      expect(typeof result.checks.balance.actual).toBe("string");
      expect(typeof result.checks.balance.expected).toBe("string");

      // Verify the values are correct
      expect(result.checks.allowance.actual).toBe(
        "115792089237316195423570985008687907853269984665640564039457584007913129639935"
      );
      expect(result.checks.allowance.expected).toBe("689821235147287");
      expect(result.checks.balance.actual).toBe("689821235147287");
      expect(result.checks.balance.expected).toBe("689821235147287");
    });
  });
});

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

  const bridgeFeeToken = {
    address: constants.AddressZero,
    symbol: TOKEN_SYMBOLS_MAP.ETH.symbol,
    decimals: TOKEN_SYMBOLS_MAP.ETH.decimals,
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

  test("should calculate fees for bridge-only route", async () => {
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
        relayerCapital: {
          total: utils.parseUnits("1", inputToken.decimals),
          pct: utils.parseEther("0.001"),
          token: inputToken,
        },
        relayerGas: {
          total: utils.parseUnits("2", inputToken.decimals),
          pct: utils.parseEther("0.002"),
          token: inputToken,
        },
        lp: {
          total: utils.parseUnits("1.5", inputToken.decimals),
          pct: utils.parseEther("0.0015"),
          token: inputToken,
        },
        totalRelay: {
          total: utils.parseUnits("4.5", inputToken.decimals),
          pct: utils.parseEther("0.0045"),
          token: inputToken,
        },
        bridgeFee: {
          total: utils.parseUnits("0.5", bridgeFeeToken.decimals),
          pct: utils.parseEther("0"),
          token: bridgeFeeToken,
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
    expect(result.total?.amount).toBeDefined();
    expect(result.total?.amountUsd).toBe("5.0"); // 1000 - 995 = 5 USDC
    expect(result.total?.pct).toBeDefined();
    expect(result.total?.token).toEqual(inputToken);

    // Verify max total fee structure (same as expected total fee structure for no-swap)
    expect(result.totalMax?.amount).toBeDefined();
    expect(result.totalMax?.amountUsd).toBe("5.0"); // 1000 - 995 = 5 USDC
    expect(result.totalMax?.pct).toBeDefined();
    expect(result.totalMax?.token).toEqual(inputToken);

    // Verify origin gas fee
    // 0.005 ETH * $2000 = $10
    expect(result.originGas?.amount).toEqual(originTxGas.mul(originTxGasPrice));
    expect(result.originGas?.amountUsd).toBe("10.0");
    expect(result.originGas?.token.symbol).toBe("ETH");
    expect(result.originGas?.pct).toBeUndefined(); // No pct for gas fees

    // Verify destination gas fee (2 USDC = $2)
    expect(result.destinationGas?.amountUsd).toBe("2.0");
    expect(result.destinationGas?.token.symbol).toBe("ETH");

    // Verify relayer capital fee (1 USDC = $1)
    expect(result.relayerCapital?.amount).toEqual(
      bridgeQuote.fees.relayerCapital.total
    );
    expect(result.relayerCapital?.amountUsd).toBe("1.0");
    expect(result.relayerCapital?.token).toEqual(inputToken);

    // Verify LP fee (1.5 USDC = $1.5)
    expect(result.lpFee?.amount).toEqual(bridgeQuote.fees.lp.total);
    expect(result.lpFee?.amountUsd).toBe("1.5");
    expect(result.lpFee?.token).toEqual(inputToken);

    // Verify relayer total fee (4.5 USDC = $4.5)
    expect(result.relayerTotal?.amount).toEqual(
      bridgeQuote.fees.totalRelay.total
    );
    expect(result.relayerTotal?.amountUsd).toBe("4.5");
    expect(result.relayerTotal?.token).toEqual(inputToken);

    // Verify bridge fee (0.5 ETH = $1000)
    expect(result.bridgeFee?.amount).toEqual(bridgeQuote.fees.bridgeFee.total);
    expect(result.bridgeFee?.amountUsd).toBe("1000.0");
    expect(result.bridgeFee?.token).toEqual(bridgeFeeToken);

    // Verify app fee (0 in this test)
    expect(result.app?.amount).toEqual(BigNumber.from(0));
    expect(result.app?.amountUsd).toBe("0.0");
    expect(result.app?.token).toEqual(outputToken);
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
        relayerCapital: {
          total: utils.parseUnits("1", inputToken.decimals),
          pct: utils.parseEther("0.001"),
          token: inputToken,
        },
        relayerGas: {
          total: utils.parseUnits("2", inputToken.decimals),
          pct: utils.parseEther("0.002"),
          token: inputToken,
        },
        lp: {
          total: utils.parseUnits("1.5", inputToken.decimals),
          pct: utils.parseEther("0.0015"),
          token: inputToken,
        },
        totalRelay: {
          total: utils.parseUnits("4.5", inputToken.decimals),
          pct: utils.parseEther("0.0045"),
          token: inputToken,
        },
        bridgeFee: {
          total: utils.parseUnits("0", inputToken.decimals),
          pct: utils.parseEther("0"),
          token: inputToken,
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
    expect(result.total?.amount).toBeDefined();
    expect(result.total?.amountUsd).toBe("4.5"); // only relayer fees
    expect(result.total?.pct).toBeDefined();
    expect(result.total?.token).toEqual(inputToken);

    // Verify max total fee structure (with slippage)
    expect(result.totalMax?.amount).toBeDefined();
    expect(result.totalMax?.amountUsd).toBe("5.0"); // relayer fees + slippage
    expect(result.totalMax?.pct).toBeDefined();
    expect(result.totalMax?.token).toEqual(inputToken);

    // Verify swap impact
    expect(result.swapImpact?.amount).toBeDefined();
    expect(result.swapImpact?.amountUsd).toBe("0.0"); // no slippage
    expect(result.swapImpact?.pct).toBeDefined();
    expect(result.swapImpact?.token).toEqual(inputToken);

    // Verify max swap impact
    expect(result.maxSwapImpact?.amount).toBeDefined();
    expect(result.maxSwapImpact?.amountUsd).toBe("0.5"); // slippage
    expect(result.maxSwapImpact?.pct).toBeDefined();
    expect(result.maxSwapImpact?.token).toEqual(inputToken);
  });
});
