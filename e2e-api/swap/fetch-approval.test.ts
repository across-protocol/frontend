import { BigNumber, ethers } from "ethers";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";

import { e2eConfig, axiosInstance } from "../utils/config";
import { ENABLED_ROUTES } from "../../api/_utils";

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
    testCases: (typeof B2B_BASE_TEST_CASE)[],
    tradeType: string,
    swapTypeValidator: (response: any, inputParams: any) => void,
    amountTypeValidator: (response: any, inputParams: any) => void
  ) => {
    testCases.forEach((testCase) => {
      it(`should get valid swap quote for ${
        testCase.inputToken.symbol
      } (${testCase.originChainId}) -> ${
        testCase.outputToken.symbol
      } (${testCase.destinationChainId})`, async () => {
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
      }, 30_000);
    });
  };

  describe("Error handling", () => {
    it("should throw 400 for invalid parameters", async () => {
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
    }, 30_000);
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

  describe("Wrapped Tokens", () => {
    jest.setTimeout(30000);
    const tokensToTest = [
      "WETH",
      "WBNB",
      "WMATIC",
      "WHYPE",
      "TATARA-WBTC",
      "WAZERO",
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
        test(`should return ${tokenSymbol} for ${route.fromChain} to ${route.toChain}`, async () => {
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
          console.log("Request Params:", JSON.stringify(params, null, 2));
          console.log("Response Data:", JSON.stringify(response.data, null, 2));
          console.log("URL:", SWAP_API_URL);
          expect(response.status).toBe(200);
          expect(response.data.inputToken.symbol).toBe(route.fromTokenSymbol);
          expect(response.data.outputToken.symbol).toBe(route.toTokenSymbol);
        }, 10000);
      }
    }
  });

  describe("Ambiguous Tokens", () => {
    jest.setTimeout(100000);
    const tokensToTest = ["USDC", "USDT"];

    for (const tokenSymbol of tokensToTest) {
      const route = ENABLED_ROUTES.routes.find(
        (r) =>
          r.fromTokenSymbol === tokenSymbol || r.toTokenSymbol === tokenSymbol
      );
      if (route) {
        test(`should return ${tokenSymbol} for ${route.fromChain} to ${route.toChain}`, async () => {
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
        }, 10000);
      }
    }
  });
});
