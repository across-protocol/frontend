import { BigNumber, ethers } from "ethers";

import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../api/_constants";
import { compactAxiosError, ENABLED_ROUTES } from "../../api/_utils";
import { e2eConfig, axiosInstance, JEST_TIMEOUT_MS } from "../utils/config";

const SWAP_API_BASE_URL = e2eConfig.swapApiBaseUrl;
const SWAP_API_URL = `${SWAP_API_BASE_URL}/api/swap/approval`;

const B2B_BASE_TEST_CASE = {
  amount: ethers.utils.parseUnits("1", 6).toString(), // 1 USDC
  inputToken: TOKEN_SYMBOLS_MAP.USDC,
  outputToken: TOKEN_SYMBOLS_MAP.USDC,
  originChainId: CHAIN_IDs.OPTIMISM,
  destinationChainId: CHAIN_IDs.ARBITRUM,
  depositor: e2eConfig.addresses.depositor,
};

const A2A_BASE_TEST_CASE = {
  amount: ethers.utils
    .parseUnits("1", TOKEN_SYMBOLS_MAP.WBNB.decimals)
    .toString(),
  inputToken: TOKEN_SYMBOLS_MAP.WBNB,
  outputToken: {
    addresses: {
      [CHAIN_IDs.ARBITRUM]: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34",
    },
    symbol: "USDe",
    decimals: 18,
  },
  originChainId: CHAIN_IDs.BSC,
  destinationChainId: CHAIN_IDs.ARBITRUM,
  depositor: e2eConfig.addresses.depositor,
};

describe("GET /swap/approval", () => {
  // Helper function to validate response structure
  const validateSwapApprovalResponse = (response: any) => {
    expect(response.data).toBeDefined();
    expect(response.data.crossSwapType).toBeDefined();
    expect(response.data.amountType).toBeDefined();
    expect(response.data.inputToken).toBeDefined();
    expect(response.data.outputToken).toBeDefined();
    expect(response.data.inputAmount).toBeDefined();
    expect(response.data.expectedOutputAmount).toBeDefined();
    expect(response.data.minOutputAmount).toBeDefined();
    expect(response.data.steps).toBeDefined();
    expect(response.data.steps.bridge).toBeDefined();
    expect(response.data.checks).toBeDefined();
    expect(response.data.checks.allowance).toBeDefined();
    expect(response.data.checks.balance).toBeDefined();

    // Validate token structure
    expect(response.data.inputToken.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(response.data.inputToken.symbol).toBeDefined();
    expect(response.data.inputToken.chainId).toBeDefined();
    expect(response.data.outputToken.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(response.data.outputToken.symbol).toBeDefined();
    expect(response.data.outputToken.chainId).toBeDefined();

    // Validate amounts are strings
    expect(response.data.inputAmount).toMatch(/^\d+$/);
    expect(response.data.expectedOutputAmount).toMatch(/^\d+$/);
    expect(response.data.minOutputAmount).toMatch(/^\d+$/);

    // Validate bridge step structure
    expect(response.data.steps.bridge.inputAmount).toMatch(/^\d+$/);
    expect(response.data.steps.bridge.outputAmount).toMatch(/^\d+$/);
    expect(response.data.steps.bridge.tokenIn).toBeDefined();
    expect(response.data.steps.bridge.tokenOut).toBeDefined();
    expect(response.data.steps.bridge.fees).toBeDefined();

    // Validate checks structure
    expect(response.data.checks.allowance.actual).toMatch(/^\d+$/);
    expect(response.data.checks.allowance.expected).toMatch(/^\d+$/);
    expect(response.data.checks.balance.actual).toMatch(/^\d+$/);
    expect(response.data.checks.balance.expected).toMatch(/^\d+$/);
  };

  // B2B specific checks
  const validateB2BResponse = (response: any, _inputParams: any) => {
    validateSwapApprovalResponse(response);

    expect(response.data.steps.originSwap).toBeUndefined();
    expect(response.data.steps.bridge).toBeDefined();
    expect(response.data.steps.destinationSwap).toBeUndefined();
  };

  // A2A specific checks
  const validateA2AResponse = (response: any, _inputParams: any) => {
    validateSwapApprovalResponse(response);

    expect(response.data.steps.originSwap).toBeDefined();
    expect(response.data.steps.bridge).toBeDefined();
    expect(response.data.steps.destinationSwap).toBeDefined();

    // Should prefer USDC as bridge token
    expect(response.data.steps.bridge.tokenIn.symbol.includes("USDC")).toBe(
      true
    );
    expect(response.data.steps.bridge.tokenOut.symbol.includes("USDC")).toBe(
      true
    );
  };

  const validateExactInputResponse = (response: any, inputParams: any) => {
    expect(response.data.inputAmount).toEqual(inputParams.amount);
  };

  const validateExactOutputResponse = (response: any, inputParams: any) => {
    expect(response.data.expectedOutputAmount).toEqual(inputParams.amount);
  };

  const validateMinOutputResponse = (response: any, inputParams: any) => {
    expect(
      BigNumber.from(response.data.minOutputAmount).gte(inputParams.amount)
    ).toBe(true);
  };

  const testBaseTestCases = (
    testCases: (typeof B2B_BASE_TEST_CASE | typeof A2A_BASE_TEST_CASE)[],
    tradeType: string,
    swapTypeValidator: (response: any, inputParams: any) => void,
    amountTypeValidator: (response: any, inputParams: any) => void
  ) => {
    testCases.forEach((testCase) => {
      it(
        `should get valid swap quote for ${
          testCase.inputToken.symbol
        } (${testCase.originChainId}) -> ${
          testCase.outputToken.symbol
        } (${testCase.destinationChainId})`,
        async () => {
          const response = await axiosInstance.get(SWAP_API_URL, {
            params: {
              amount: testCase.amount,
              tradeType,
              inputToken: testCase.inputToken.addresses[testCase.originChainId],
              outputToken:
                testCase.outputToken.addresses[testCase.destinationChainId],
              originChainId: testCase.originChainId,
              destinationChainId: testCase.destinationChainId,
              depositor: testCase.depositor,
            },
          });
          expect(response.status).toBe(200);
          swapTypeValidator(response, testCase);
          amountTypeValidator(response, testCase);
        },
        JEST_TIMEOUT_MS
      );
    });
  };

  describe("Error handling", () => {
    it(
      "should throw 400 for invalid parameters",
      async () => {
        try {
          await axiosInstance.get(SWAP_API_URL, {
            params: {
              amount: "invalid",
              tradeType: "exactInput",
              inputToken: "invalid_address",
              outputToken: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
              originChainId: 10,
              destinationChainId: 42161,
              depositor: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
            },
          });
          // If we get here, the API should have returned an error
          expect(true).toBe(false); // This should not be reached
        } catch (error: any) {
          expect(error.response?.status).toBeGreaterThanOrEqual(400);
          expect(error.response?.status).toBeLessThan(500);
        }
      },
      JEST_TIMEOUT_MS
    );
  });

  describe("B2B", () => {
    describe("exactInput", () => {
      testBaseTestCases(
        [B2B_BASE_TEST_CASE],
        "exactInput",
        validateB2BResponse,
        validateExactInputResponse
      );
    });

    describe("minOutput", () => {
      testBaseTestCases(
        [B2B_BASE_TEST_CASE],
        "minOutput",
        validateB2BResponse,
        validateMinOutputResponse
      );
    });

    describe("exactOutput", () => {
      testBaseTestCases(
        [B2B_BASE_TEST_CASE],
        "exactOutput",
        validateB2BResponse,
        validateExactOutputResponse
      );
    });
  });

  describe("A2A", () => {
    describe("exactInput", () => {
      testBaseTestCases(
        [A2A_BASE_TEST_CASE],
        "exactInput",
        validateA2AResponse,
        validateExactInputResponse
      );
    });
  });

  describe("Native Tokens", () => {
    test(
      "should return correct native token infos for ETH",
      async () => {
        const response = await axiosInstance.get(SWAP_API_URL, {
          params: {
            amount: ethers.utils.parseEther("0.1").toString(),
            inputToken: ethers.constants.AddressZero,
            outputToken: ethers.constants.AddressZero,
            originChainId: CHAIN_IDs.OPTIMISM,
            destinationChainId: CHAIN_IDs.ARBITRUM,
            depositor: e2eConfig.addresses.depositor,
          },
        });
        expect(response.status).toBe(200);
        expect(response.data.inputToken.symbol).toBe("ETH");
        expect(response.data.inputToken.address).toBe(
          ethers.constants.AddressZero
        );
        expect(response.data.outputToken.symbol).toBe("ETH");
        expect(response.data.outputToken.address).toBe(
          ethers.constants.AddressZero
        );
      },
      JEST_TIMEOUT_MS
    );

    test(
      "should return correct native token infos for non-ETH",
      async () => {
        const response = await axiosInstance.get(SWAP_API_URL, {
          params: {
            amount: ethers.utils.parseEther("0.1").toString(),
            inputToken: ethers.constants.AddressZero,
            outputToken: ethers.constants.AddressZero,
            originChainId: CHAIN_IDs.BSC,
            destinationChainId: CHAIN_IDs.OPTIMISM,
            depositor: e2eConfig.addresses.depositor,
          },
        });
        expect(response.status).toBe(200);
        expect(response.data.inputToken.symbol).toBe("BNB");
        expect(response.data.inputToken.address).toBe(
          ethers.constants.AddressZero
        );
        expect(response.data.outputToken.symbol).toBe("ETH");
        expect(response.data.outputToken.address).toBe(
          ethers.constants.AddressZero
        );
      },
      JEST_TIMEOUT_MS
    );
  });

  describe("Wrapped Tokens", () => {
    jest.setTimeout(JEST_TIMEOUT_MS);
    const tokensToTest = [
      "WETH",
      "WBNB",
      "WPOL",
      "WHYPE",
      "TATARA-WBTC",
      "WGHO",
      "WGRASS",
      "WSOL",
      "WXPL",
    ];

    for (const tokenSymbol of tokensToTest) {
      const route = ENABLED_ROUTES.routes.find(
        (r) =>
          r.fromTokenSymbol === tokenSymbol || r.toTokenSymbol === tokenSymbol
      );
      if (route) {
        test(
          `should return ${tokenSymbol} for ${route.fromChain} to ${route.toChain}`,
          async () => {
            const params = {
              tradeType: "exactInput",
              amount: "10000000000000000",
              inputToken: route.fromTokenAddress,
              outputToken: route.toTokenAddress,
              originChainId: route.fromChain,
              destinationChainId: route.toChain,
              depositor: "0xB8034521BB1a343D556e5005680B3F17FFc74BeD",
              recipient: "0xB8034521BB1a343D556e5005680B3F17FFc74BeD",
            };
            const response = await axiosInstance.get(SWAP_API_URL, {
              params,
            });
            expect(response.status).toBe(200);
            expect(response.data.inputToken.symbol).toBe(route.fromTokenSymbol);
            expect(response.data.outputToken.symbol).toBe(route.toTokenSymbol);
          },
          JEST_TIMEOUT_MS
        );
      }
    }
  });

  describe("Ambiguous Tokens", () => {
    jest.setTimeout(JEST_TIMEOUT_MS);
    const tokensToTest = ["USDC", "USDT"];

    for (const tokenSymbol of tokensToTest) {
      const route = ENABLED_ROUTES.routes.find(
        (r) =>
          r.fromTokenSymbol === tokenSymbol || r.toTokenSymbol === tokenSymbol
      );
      if (route) {
        test(
          `should return ${tokenSymbol} for ${route.fromChain} to ${route.toChain}`,
          async () => {
            const params = {
              tradeType: "exactInput",
              amount: "1000000",
              inputToken: route.fromTokenAddress,
              outputToken: route.toTokenAddress,
              originChainId: route.fromChain,
              destinationChainId: route.toChain,
              depositor: "0xB8034521BB1a343D556e5005680B3F17FFc74BeD",
              recipient: "0xB8034521BB1a343D556e5005680B3F17FFc74BeD",
            };
            const response = await axiosInstance.get(SWAP_API_URL, {
              params,
            });
            expect(response.status).toBe(200);
            expect(response.data.inputToken.symbol).toBe(route.fromTokenSymbol);
            expect(response.data.outputToken.symbol).toBe(route.toTokenSymbol);
          },
          JEST_TIMEOUT_MS
        );
      }
    }
  });

  describe("'slippage' query parameter", () => {
    jest.setTimeout(JEST_TIMEOUT_MS);
    const baseParams = {
      amount: ethers.utils.parseUnits("10", 6).toString(), // 10 USDC
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
      outputToken: TOKEN_SYMBOLS_MAP.OP.addresses[CHAIN_IDs.OPTIMISM],
      originChainId: CHAIN_IDs.ARBITRUM,
      destinationChainId: CHAIN_IDs.OPTIMISM,
      depositor: e2eConfig.addresses.depositor,
    };

    test(
      "should return a 'auto' resolved slippage for destination swap using local strategy",
      async () => {
        const response = await axiosInstance.get(SWAP_API_URL, {
          params: {
            ...baseParams,
            slippage: "auto",
            // Use Sushiswap to avoid using the Uniswap API for slippage resolution
            includeSources: "sushiswap",
          },
        });
        expect(response.status).toBe(200);
        expect(response.data.steps.destinationSwap).toBeDefined();
        // Resolved slippage should be between 0.5% and 5%
        expect(
          response.data.steps.destinationSwap.slippage
        ).toBeGreaterThanOrEqual(0.005);
        expect(
          response.data.steps.destinationSwap.slippage
        ).toBeLessThanOrEqual(0.05);
      },
      JEST_TIMEOUT_MS
    );

    test(
      "should return a 'auto' resolved slippage for destination swap using uniswap-api",
      async () => {
        const response = await axiosInstance.get(SWAP_API_URL, {
          params: {
            ...baseParams,
            slippage: "auto",
            includeSources: "uniswap-api",
          },
        });
        expect(response.status).toBe(200);
        expect(response.data.steps.destinationSwap).toBeDefined();
        expect(
          response.data.steps.destinationSwap.slippage
        ).toBeGreaterThanOrEqual(0);
        expect(
          response.data.steps.destinationSwap.slippage
        ).toBeLessThanOrEqual(0.1);
      },
      JEST_TIMEOUT_MS
    );

    test(
      "should use provided slippage tolerance for destination swap",
      async () => {
        const response = await axiosInstance.get(SWAP_API_URL, {
          params: {
            ...baseParams,
            slippage: 0.01,
          },
        });
        expect(response.status).toBe(200);
        expect(response.data.steps.destinationSwap).toBeDefined();
        expect(response.data.steps.destinationSwap.slippage).toBe(0.01);
      },
      JEST_TIMEOUT_MS
    );
  });

  describe("Sponsored Intents USDH", () => {
    const inputTokensToTest = [
      {
        decimals: TOKEN_SYMBOLS_MAP.USDC.decimals,
        address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
        chainId: CHAIN_IDs.ARBITRUM,
        symbol: TOKEN_SYMBOLS_MAP.USDC.symbol,
      },
      // {
      //   decimals: TOKEN_SYMBOLS_MAP["USDC-BNB"].decimals,
      //   address: TOKEN_SYMBOLS_MAP["USDC-BNB"].addresses[CHAIN_IDs.BSC],
      //   chainId: CHAIN_IDs.BSC,
      //   symbol: TOKEN_SYMBOLS_MAP["USDC-BNB"].symbol,
      // },
    ];

    async function testSponsoredIntentsUsdh(
      inputAmountUsd: number,
      inputToken: {
        decimals: number;
        address: string;
        chainId: number;
      },
      destinationChainId: number
    ) {
      const inputAmountUsdc = ethers.utils
        .parseUnits(inputAmountUsd.toString(), inputToken.decimals)
        .toString();
      const destinationToken =
        destinationChainId === CHAIN_IDs.HYPERCORE
          ? TOKEN_SYMBOLS_MAP["USDH-SPOT"]
          : TOKEN_SYMBOLS_MAP.USDH;
      try {
        const response = await axiosInstance.get(SWAP_API_URL, {
          params: {
            amount: inputAmountUsdc,
            inputToken: inputToken.address,
            outputToken: destinationToken.addresses[destinationChainId],
            originChainId: inputToken.chainId,
            destinationChainId,
            depositor: e2eConfig.addresses.depositor,
          },
        });
        expect(response.status).toBe(200);
        expect(response.data.inputAmount).toBe(inputAmountUsdc);
        expect(response.data.expectedOutputAmount).toEqual(
          response.data.minOutputAmount
        );
        expect(response.data.expectedOutputAmount).toEqual(
          ethers.utils
            .parseUnits(inputAmountUsd.toString(), destinationToken.decimals)
            .toString()
        );
      } catch (error: any) {
        throw compactAxiosError(error);
      }
    }

    for (const inputToken of inputTokensToTest) {
      test(`should return a valid quote for ${
        inputToken.symbol
      } on ${inputToken.chainId} -> USDH on HyperCore`, async () => {
        await testSponsoredIntentsUsdh(1, inputToken, CHAIN_IDs.HYPERCORE);
      });

      test(`should return a valid quote for ${
        inputToken.symbol
      } on ${inputToken.chainId} -> USDH on HyperEvm`, async () => {
        await testSponsoredIntentsUsdh(1, inputToken, CHAIN_IDs.HYPEREVM);
      });
    }
  });
});
