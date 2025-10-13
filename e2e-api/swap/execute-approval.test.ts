import axios from "axios";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
import { Address, parseUnits, PrivateKeyAccount } from "viem";

import { makeE2EConfig, E2EConfig } from "../utils/config";
import { executeApprovalAndDeposit } from "../utils/deposit";
import { executeFill } from "../utils/fill";
import { getBalance } from "../utils/token";

import { type SwapQuoteResponse } from "../utils/deposit";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

type TradeType = "exactInput" | "exactOutput" | "minOutput";

const TOKEN_FUND_AMOUNT = 1_000_000; // Unparsed amount of tokens to fund the depositor and relayer, e.g. 1_000_000 USDC

const B2B_BASE_TEST_CASE = {
  amounts: {
    exactInput: parseUnits("100", 6), // 1 USDC
    exactOutput: parseUnits("100", 6), // 1 USDC
    minOutput: parseUnits("100", 6), // 1 USDC
  },
  inputToken: TOKEN_SYMBOLS_MAP.USDC,
  outputToken: TOKEN_SYMBOLS_MAP.USDC,
  originChainId: CHAIN_IDs.BASE,
  destinationChainId: CHAIN_IDs.OPTIMISM,
  appFee: 0.01, // 1% app fee
};

const B2A_BASE_TEST_CASE = {
  amounts: {
    exactInput: parseUnits("100", 6), // 1 USDC
    exactOutput: parseUnits("100", 18), // 1 OP
    minOutput: parseUnits("100", 18), // 1 OP
  },
  inputToken: TOKEN_SYMBOLS_MAP.USDC,
  outputToken: TOKEN_SYMBOLS_MAP.OP,
  originChainId: CHAIN_IDs.BASE,
  destinationChainId: CHAIN_IDs.OPTIMISM,
  appFee: 0.01, // 1% app fee
};

const A2B_BASE_TEST_CASE = {
  amounts: {
    exactInput: parseUnits("100", 18), // 1 OP
    exactOutput: parseUnits("100", 6), // 1 USDC
    minOutput: parseUnits("100", 6), // 1 USDC
  },
  inputToken: TOKEN_SYMBOLS_MAP.OP,
  outputToken: TOKEN_SYMBOLS_MAP.USDC,
  originChainId: CHAIN_IDs.OPTIMISM,
  destinationChainId: CHAIN_IDs.BASE,
  appFee: 0.01, // 1% app fee
};

describe("execute response of GET /swap/approval", () => {
  let e2eConfig: E2EConfig;

  beforeEach(async () => {
    e2eConfig = makeE2EConfig();
    e2eConfig.getClient(CHAIN_IDs.BASE).reset();
    e2eConfig.getClient(CHAIN_IDs.OPTIMISM).reset();
  });

  async function fetchSwapQuote(params: {
    amount: string;
    tradeType: TradeType;
    inputToken: string;
    outputToken: string;
    originChainId: number;
    destinationChainId: number;
    depositor: string;
    recipient: string;
    appFee?: number;
    appFeeRecipient?: string;
  }) {
    const response = await axios.get(
      `${e2eConfig.swapApiBaseUrl}/api/swap/approval`,
      {
        params: {
          ...params,
          includeSources: "uniswap-api",
        },
      }
    );
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    console.log("Fetched swap quote:", JSON.stringify(response.data, null, 2));
    return response.data as SwapQuoteResponse;
  }

  async function runEndToEnd(
    tradeType: TradeType,
    testCase:
      | typeof B2B_BASE_TEST_CASE
      | typeof B2A_BASE_TEST_CASE
      | typeof A2B_BASE_TEST_CASE,
    opts?: { freshDepositorWallet?: PrivateKeyAccount }
  ) {
    const {
      originChainId,
      destinationChainId,
      inputToken,
      outputToken,
      amounts,
      appFee,
    } = testCase;
    const amount = amounts[tradeType];
    const depositor = opts?.freshDepositorWallet
      ? opts.freshDepositorWallet.address
      : e2eConfig.addresses.depositor;
    const recipient = e2eConfig.addresses.recipient;
    const appFeeRecipient = e2eConfig.addresses.appFeeRecipient;
    const relayer = e2eConfig.addresses.relayer;

    const inputTokenAddress = inputToken.addresses[originChainId] as Address;
    const outputTokenAddress = outputToken.addresses[
      destinationChainId
    ] as Address;
    const originClient = e2eConfig.getClient(originChainId);
    const destinationClient = e2eConfig.getClient(destinationChainId);
    await originClient.tevmReady();
    await destinationClient.tevmReady();

    // Fund the depositor account with ETH for gas
    await originClient.setBalance({
      address: depositor,
      value: parseUnits("10", 18), // Fund with 10 ETH
    });

    // Set funds for depositor
    await originClient.tevmDeal({
      erc20: inputTokenAddress,
      account: depositor,
      amount: parseUnits(TOKEN_FUND_AMOUNT.toString(), inputToken.decimals),
    });
    await destinationClient.tevmDeal({
      erc20: outputTokenAddress,
      account: relayer,
      amount: parseUnits(TOKEN_FUND_AMOUNT.toString(), outputToken.decimals),
    });
    await originClient.tevmMine({ blockCount: 1 });
    await destinationClient.tevmMine({ blockCount: 1 });

    // Fetch swap quote
    const swapQuote = await fetchSwapQuote({
      amount: amount.toString(),
      tradeType,
      inputToken: inputTokenAddress,
      outputToken: outputTokenAddress,
      originChainId,
      destinationChainId,
      depositor,
      recipient,
      appFee,
      appFeeRecipient,
    });

    // Balances BEFORE swap tx execution
    const inputTokenBalanceBefore = await getBalance(
      inputTokenAddress,
      depositor,
      originClient
    );
    const outputTokenBalanceBefore = await getBalance(
      outputTokenAddress,
      recipient,
      destinationClient
    );

    // App fee recipient balance tracking
    let appFeeRecipientBalanceBefore = 0n;
    appFeeRecipientBalanceBefore = await getBalance(
      outputTokenAddress,
      appFeeRecipient as Address,
      destinationClient
    );

    // Execute swap tx
    const { approvalReceipts, swapReceipt, depositEvent } =
      await executeApprovalAndDeposit(swapQuote, depositor, originClient);
    // Fill the relay
    await executeFill(
      {
        depositEvent,
        originChainId,
        relayer,
      },
      destinationClient
    );

    // Balances AFTER swap and fill executions
    const inputTokenBalanceAfter = await getBalance(
      inputTokenAddress,
      depositor,
      originClient
    );
    const outputTokenBalanceAfter = await getBalance(
      outputTokenAddress,
      recipient,
      destinationClient
    );

    // App fee recipient balance tracking
    let appFeeRecipientBalanceAfter = 0n;
    appFeeRecipientBalanceAfter = await getBalance(
      outputTokenAddress,
      appFeeRecipient as Address,
      destinationClient
    );

    // Balance diffs
    const inputTokenBalanceDiff =
      inputTokenBalanceBefore - inputTokenBalanceAfter;
    const outputTokenBalanceDiff =
      outputTokenBalanceAfter - outputTokenBalanceBefore;
    const appFeeRecipientBalanceDiff =
      appFeeRecipientBalanceAfter - appFeeRecipientBalanceBefore;

    console.log(tradeType, {
      inputTokenBalanceBefore,
      inputTokenBalanceAfter,
      inputTokenBalanceDiff,
      outputTokenBalanceBefore,
      outputTokenBalanceAfter,
      outputTokenBalanceDiff,
      appFeeRecipientBalanceBefore,
      appFeeRecipientBalanceAfter,
      appFeeRecipientBalanceDiff,
      amount,
      quotedInputAmount: swapQuote.inputAmount,
      quotedMaxInputAmount: swapQuote.maxInputAmount,
      quotedOutputAmount: swapQuote.expectedOutputAmount,
      quotedMinOutputAmount: swapQuote.minOutputAmount,
    });

    // Sanity checks based on the trade type
    if (tradeType === "exactInput") {
      expect(inputTokenBalanceDiff).toEqual(amount);
      expect(outputTokenBalanceDiff).toBeGreaterThanOrEqual(
        BigInt(swapQuote.minOutputAmount.toString())
      );
      const expectedFee =
        (BigInt(swapQuote.minOutputAmount.toString()) *
          BigInt(Math.floor(appFee * 1e18))) /
        (BigInt(1e18) + BigInt(Math.floor(appFee * 1e18)));
      expect(appFeeRecipientBalanceDiff).toBeGreaterThanOrEqual(expectedFee);
    } else if (tradeType === "exactOutput") {
      expect(outputTokenBalanceDiff).toEqual(amount);
      expect(inputTokenBalanceDiff).toBeGreaterThanOrEqual(
        BigInt(swapQuote.inputAmount.toString())
      );
      expect(inputTokenBalanceDiff).toBeLessThanOrEqual(
        BigInt(swapQuote.maxInputAmount.toString())
      );
      const expectedFee =
        (amount * BigInt(Math.floor(appFee * 1e18))) / BigInt(1e18);
      expect(appFeeRecipientBalanceDiff).toBeGreaterThanOrEqual(expectedFee);
    } else if (tradeType === "minOutput") {
      expect(outputTokenBalanceDiff).toBeGreaterThanOrEqual(
        BigInt(swapQuote.minOutputAmount.toString())
      );
      expect(inputTokenBalanceDiff).toBeGreaterThanOrEqual(
        BigInt(swapQuote.inputAmount.toString())
      );
      expect(inputTokenBalanceDiff).toBeLessThanOrEqual(
        BigInt(swapQuote.maxInputAmount.toString())
      );
      const expectedFee =
        (amount * BigInt(Math.floor(appFee * 1e18))) / BigInt(1e18);
      expect(appFeeRecipientBalanceDiff).toBeGreaterThanOrEqual(expectedFee);
    }

    return {
      approvalReceipts,
      swapReceipt,
      depositEvent,
    };
  }

  async function runEndToEndWithFreshWallet(
    tradeType: TradeType,
    testCase:
      | typeof B2B_BASE_TEST_CASE
      | typeof B2A_BASE_TEST_CASE
      | typeof A2B_BASE_TEST_CASE
  ) {
    const privateKey = generatePrivateKey();
    const freshDepositorWallet = privateKeyToAccount(privateKey);
    await runEndToEnd(tradeType, testCase, { freshDepositorWallet });
  }

  describe("B2B", () => {
    describe("exactInput", () => {
      it("should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEndWithFreshWallet("exactInput", B2B_BASE_TEST_CASE);
      }, 180_000);
    });

    describe("minOutput", () => {
      it("should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEndWithFreshWallet("minOutput", B2B_BASE_TEST_CASE);
      }, 180_000);
    });

    describe("exactOutput", () => {
      it("should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEndWithFreshWallet("exactOutput", B2B_BASE_TEST_CASE);
      }, 180_000);
    });
  });

  describe("B2A", () => {
    describe("exactInput", () => {
      it("should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEndWithFreshWallet("exactInput", B2A_BASE_TEST_CASE);
      }, 180_000);
    });

    describe("exactOutput", () => {
      it("should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEndWithFreshWallet("exactOutput", B2A_BASE_TEST_CASE);
      }, 180_000);
    });

    describe("minOutput", () => {
      it("should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEndWithFreshWallet("minOutput", B2A_BASE_TEST_CASE);
      }, 180_000);
    });
  });

  describe("A2B", () => {
    describe("exactInput", () => {
      it("should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEndWithFreshWallet("exactInput", A2B_BASE_TEST_CASE);
      }, 180_000);
    });

    describe("exactOutput", () => {
      it("should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEndWithFreshWallet("exactOutput", A2B_BASE_TEST_CASE);
      }, 180_000);
    });

    describe("minOutput", () => {
      it("minOutput should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEndWithFreshWallet("minOutput", A2B_BASE_TEST_CASE);
      }, 180_000);
    });
  });
});
