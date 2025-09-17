import axios from "axios";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
import { Address, parseUnits, PrivateKeyAccount } from "viem";

import { e2eConfig } from "../utils/config";
import { executeApprovalAndDeposit } from "../utils/deposit";
import { executeFill } from "../utils/fill";
import { getBalance } from "../utils/token";

import { type SwapQuoteResponse } from "../utils/deposit";

type TradeType = "exactInput" | "exactOutput" | "minOutput";

const SWAP_API_BASE_URL = e2eConfig.swapApiBaseUrl;
const SWAP_API_URL = `${SWAP_API_BASE_URL}/api/swap/approval`;
const TOKEN_FUND_AMOUNT = 1_000_000; // Unparsed amount of tokens to fund the depositor and relayer, e.g. 1_000_000 USDC

const B2B_BASE_TEST_CASE = {
  amounts: {
    exactInput: parseUnits("1", 6), // 1 USDC
    exactOutput: parseUnits("1", 6), // 1 USDC
    minOutput: parseUnits("1", 6), // 1 USDC
  },
  inputToken: TOKEN_SYMBOLS_MAP.USDC,
  outputToken: TOKEN_SYMBOLS_MAP.USDC,
  originChainId: CHAIN_IDs.BASE,
  destinationChainId: CHAIN_IDs.OPTIMISM,
};

const B2A_BASE_TEST_CASE = {
  amounts: {
    exactInput: parseUnits("1", 6), // 1 USDC
    exactOutput: parseUnits("1", 18), // 1 OP
    minOutput: parseUnits("1", 18), // 1 OP
  },
  inputToken: TOKEN_SYMBOLS_MAP.USDC,
  outputToken: TOKEN_SYMBOLS_MAP.OP,
  originChainId: CHAIN_IDs.BASE,
  destinationChainId: CHAIN_IDs.OPTIMISM,
};

const A2B_BASE_TEST_CASE = {
  amounts: {
    exactInput: parseUnits("1", 18), // 1 OP
    exactOutput: parseUnits("1", 6), // 1 USDC
    minOutput: parseUnits("1", 6), // 1 USDC
  },
  inputToken: TOKEN_SYMBOLS_MAP.OP,
  outputToken: TOKEN_SYMBOLS_MAP.USDC,
  originChainId: CHAIN_IDs.OPTIMISM,
  destinationChainId: CHAIN_IDs.BASE,
};

describe("execute response of GET /swap/approval", () => {
  async function fetchSwapQuote(params: {
    amount: string;
    tradeType: TradeType;
    inputToken: string;
    outputToken: string;
    originChainId: number;
    destinationChainId: number;
    depositor: string;
    recipient: string;
  }) {
    const response = await axios.get(SWAP_API_URL, {
      params: {
        ...params,
        includeSources: "uniswap-api",
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
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
    } = testCase;
    const amount = amounts[tradeType];
    const depositor = opts?.freshDepositorWallet
      ? opts.freshDepositorWallet.address
      : e2eConfig.addresses.depositor;
    const recipient = e2eConfig.addresses.recipient;

    const inputTokenAddress = inputToken.addresses[originChainId] as Address;
    const outputTokenAddress = outputToken.addresses[
      destinationChainId
    ] as Address;
    const originClient = e2eConfig.getClient(originChainId);
    const destinationClient = e2eConfig.getClient(destinationChainId);
    await originClient.tevmReady();
    await destinationClient.tevmReady();

    // Set funds for depositor
    await originClient.tevmDeal({
      erc20: inputTokenAddress,
      account: depositor,
      amount: parseUnits(TOKEN_FUND_AMOUNT.toString(), inputToken.decimals),
    });
    await originClient.tevmMine({ blockCount: 1 });

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
    });

    // Balances BEFORE swap tx execution
    const inputTokenBalanceBefore = await getBalance(
      originChainId,
      inputTokenAddress,
      depositor
    );
    const outputTokenBalanceBefore = await getBalance(
      destinationChainId,
      outputTokenAddress,
      recipient
    );

    // Execute swap tx
    const { approvalReceipts, swapReceipt, depositEvent } =
      await executeApprovalAndDeposit(swapQuote);

    // Fill the relay
    await executeFill({
      depositEvent,
      originChainId,
    });

    // Balances AFTER swap and fill executions
    const inputTokenBalanceAfter = await getBalance(
      originChainId,
      inputTokenAddress,
      depositor
    );
    const outputTokenBalanceAfter = await getBalance(
      destinationChainId,
      outputTokenAddress,
      recipient
    );

    // Balance diffs
    const inputTokenBalanceDiff =
      inputTokenBalanceBefore - inputTokenBalanceAfter;
    const outputTokenBalanceDiff =
      outputTokenBalanceAfter - outputTokenBalanceBefore;

    console.log(tradeType, {
      inputTokenBalanceBefore,
      inputTokenBalanceAfter,
      inputTokenBalanceDiff,
      outputTokenBalanceBefore,
      outputTokenBalanceAfter,
      outputTokenBalanceDiff,
      amount,
      quotedInputAmount: swapQuote.inputAmount,
      quotedMaxInputAmount: swapQuote.maxInputAmount,
      quotedOutputAmount: swapQuote.expectedOutputAmount,
      quotedMinOutputAmount: swapQuote.minOutputAmount,
    });

    // Sanity checks based on the trade type
    if (tradeType === "exactInput") {
      expect(inputTokenBalanceDiff === amount).toBe(true);
      expect(
        outputTokenBalanceDiff >= BigInt(swapQuote.minOutputAmount.toString())
      ).toBe(true);
    } else if (tradeType === "exactOutput") {
      expect(outputTokenBalanceDiff).toEqual(amount);
      expect(
        inputTokenBalanceDiff >= BigInt(swapQuote.inputAmount.toString())
      ).toBe(true);
      expect(
        inputTokenBalanceDiff <= BigInt(swapQuote.maxInputAmount.toString())
      ).toBe(true);
    } else if (tradeType === "minOutput") {
      expect(outputTokenBalanceDiff >= amount).toBe(true);
      expect(
        inputTokenBalanceDiff >= BigInt(swapQuote.inputAmount.toString())
      ).toBe(true);
      expect(
        inputTokenBalanceDiff <= BigInt(swapQuote.maxInputAmount.toString())
      ).toBe(true);
    }

    return {
      approvalReceipts,
      swapReceipt,
      depositEvent,
    };
  }

  describe("B2B", () => {
    describe("exactInput", () => {
      it("should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEnd("exactInput", B2B_BASE_TEST_CASE);
      }, 180_000);
    });

    describe("minOutput", () => {
      it("should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEnd("minOutput", B2B_BASE_TEST_CASE);
      }, 180_000);
    });

    describe("exactOutput", () => {
      it("should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEnd("exactOutput", B2B_BASE_TEST_CASE);
      }, 180_000);
    });
  });

  describe("B2A", () => {
    describe("exactInput", () => {
      it("should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEnd("exactInput", B2A_BASE_TEST_CASE);
      }, 180_000);
    });

    describe("exactOutput", () => {
      it("should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEnd("exactOutput", B2A_BASE_TEST_CASE);
      }, 180_000);
    });

    describe("minOutput", () => {
      it("should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEnd("minOutput", B2A_BASE_TEST_CASE);
      }, 180_000);
    });
  });

  describe("A2B", () => {
    describe("exactInput", () => {
      it("should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEnd("exactInput", A2B_BASE_TEST_CASE);
      }, 180_000);
    });

    describe("exactOutput", () => {
      it("should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEnd("exactOutput", A2B_BASE_TEST_CASE);
      }, 180_000);
    });

    describe("minOutput", () => {
      it("should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEnd("minOutput", A2B_BASE_TEST_CASE);
      }, 180_000);
    });
  });
});
