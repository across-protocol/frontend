import dotenv from "dotenv";
import axios from "axios";
import { BigNumber, ethers } from "ethers";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";

dotenv.config({
  path: [".env.e2e", ".env.local", ".env"],
});

const SWAP_API_BASE_URL =
  process.env.E2E_TESTS_SWAP_API_BASE_URL || "https://app.across.to/api";
const SWAP_API_URL = `${SWAP_API_BASE_URL}/swap/approval`;
const DEPOSITOR = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";

describe("/swap/approval e2e tests", () => {
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
    expect(response.data.steps.bridge.inputAmount).toBeDefined();
    expect(response.data.steps.bridge.outputAmount).toBeDefined();
    expect(response.data.steps.bridge.tokenIn).toBeDefined();
    expect(response.data.steps.bridge.tokenOut).toBeDefined();
    expect(response.data.steps.bridge.fees).toBeDefined();

    // Validate checks structure
    expect(response.data.checks.allowance.actual).toBeDefined();
    expect(response.data.checks.allowance.expected).toBeDefined();
    expect(response.data.checks.balance.actual).toBeDefined();
    expect(response.data.checks.balance.expected).toBeDefined();
  };

  // B2B specific checks
  const validateB2BResponse = (response: any, inputParams: any) => {
    validateSwapApprovalResponse(response);

    expect(response.data.steps.originSwap).toBeUndefined();
    expect(response.data.steps.bridge).toBeDefined();
    expect(response.data.steps.destinationSwap).toBeUndefined();
  };

  // B2A specific checks
  const validateB2AResponse = (response: any, inputParams: any) => {
    validateSwapApprovalResponse(response);
    expect(response.data.steps.originSwap).toBeDefined();
    expect(response.data.steps.bridge).toBeUndefined();
    expect(response.data.steps.destinationSwap).toBeDefined();
  };

  // A2B specific checks
  const validateA2BResponse = (response: any, inputParams: any) => {
    validateSwapApprovalResponse(response);
    expect(response.data.steps.originSwap).toBeDefined();
    expect(response.data.steps.bridge).toBeUndefined();
    expect(response.data.steps.destinationSwap).toBeDefined();
  };

  // A2A specific checks
  const validateA2AResponse = (response: any, inputParams: any) => {
    validateSwapApprovalResponse(response);
    expect(response.data.steps.originSwap).toBeDefined();
    expect(response.data.steps.bridge).toBeDefined();
    expect(response.data.steps.destinationSwap).toBeDefined();
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

  describe("Error handling", () => {
    it("should throw 400 for invalid parameters", async () => {
      try {
        await axios.get(SWAP_API_URL, {
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
    });
  });

  describe("B2B", () => {
    const baseTestCases = [
      {
        amount: ethers.utils.parseUnits("1", 6).toString(), // 1 USDC
        inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM], // USDC on Optimism
        outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM], // USDC on Arbitrum
        originChainId: CHAIN_IDs.OPTIMISM,
        destinationChainId: CHAIN_IDs.ARBITRUM,
        depositor: DEPOSITOR,
      },
    ];

    describe("exactInput", () => {
      const testCases = baseTestCases.map((testCase) => ({
        ...testCase,
        tradeType: "exactInput",
      }));

      testCases.forEach((testCase) => {
        it(`should get valid swap quote for ${
          testCase.inputToken
        } (${testCase.originChainId}) - ${
          testCase.outputToken
        } (${testCase.destinationChainId})`, async () => {
          const response = await axios.get(SWAP_API_URL, {
            params: testCase,
          });
          expect(response.status).toBe(200);
          validateB2BResponse(response, testCase);
          validateExactInputResponse(response, testCase);
        });
      }, 30_000);
    });

    describe("exactOutput", () => {
      const testCases = baseTestCases.map((testCase) => ({
        ...testCase,
        tradeType: "exactOutput",
      }));

      testCases.forEach((testCase) => {
        it(`should get valid swap quote for ${
          testCase.inputToken
        } (${testCase.originChainId}) - ${
          testCase.outputToken
        } (${testCase.destinationChainId})`, async () => {
          const response = await axios.get(SWAP_API_URL, {
            params: testCase,
          });
          expect(response.status).toBe(200);
          validateB2BResponse(response, testCase);
          validateExactOutputResponse(response, testCase);
        });
      }, 30_000);
    });

    describe("minOutput", () => {
      const testCases = baseTestCases.map((testCase) => ({
        ...testCase,
        tradeType: "minOutput",
      }));

      testCases.forEach((testCase) => {
        it(`should get valid swap quote for ${
          testCase.inputToken
        } (${testCase.originChainId}) - ${
          testCase.outputToken
        } (${testCase.destinationChainId})`, async () => {
          const response = await axios.get(SWAP_API_URL, {
            params: testCase,
          });
          expect(response.status).toBe(200);
          validateB2BResponse(response, testCase);
          validateMinOutputResponse(response, testCase);
        });
      }, 30_000);
    });
  });
});
