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
const TOKEN_FUND_AMOUNT = 1_000_000n; // Unparsed amount of tokens to fund the depositor and relayer

const B2B_BASE_TEST_CASE = {
  amount: parseUnits("1", 6), // 1 USDC
  inputToken: TOKEN_SYMBOLS_MAP.USDC,
  outputToken: TOKEN_SYMBOLS_MAP.USDC,
  originChainId: CHAIN_IDs.OPTIMISM,
  destinationChainId: CHAIN_IDs.MAINNET,
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
  }) {
    const response = await axios.get(SWAP_API_URL, {
      params: {
        ...params,
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    return response.data as SwapQuoteResponse;
  }

  async function runEndToEnd(
    tradeType: TradeType,
    testCase: typeof B2B_BASE_TEST_CASE,
    opts?: { freshDepositorWallet?: PrivateKeyAccount }
  ) {
    const {
      originChainId,
      destinationChainId,
      inputToken,
      outputToken,
      amount,
    } = testCase;
    const depositor = opts?.freshDepositorWallet
      ? opts.freshDepositorWallet.address
      : e2eConfig.addresses.depositor;

    const inputTokenAddress = inputToken.addresses[originChainId] as Address;
    const outputTokenAddress = outputToken.addresses[
      destinationChainId
    ] as Address;
    const originClient = e2eConfig.getClient(originChainId);
    const destinationClient = e2eConfig.getClient(destinationChainId);

    // Set funds for depositor
    const dealReceipt = await originClient.tevmDeal({
      erc20: inputTokenAddress,
      account: depositor,
      amount: TOKEN_FUND_AMOUNT,
    });
    console.log("dealReceipt", dealReceipt);

    const swapQuote = await fetchSwapQuote({
      amount: testCase.amount.toString(),
      tradeType,
      inputToken: inputTokenAddress,
      outputToken: outputTokenAddress,
      originChainId,
      destinationChainId,
      depositor,
    });
    console.log("swapQuote", swapQuote);

    // Balances BEFORE swap tx execution
    const inputTokenBalanceBefore = await getBalance(
      originChainId,
      inputTokenAddress,
      depositor
    );
    const outputTokenBalanceBefore = await getBalance(
      destinationChainId,
      outputTokenAddress,
      depositor
    );
    console.log("inputTokenBalanceBefore", inputTokenBalanceBefore);
    console.log("outputTokenBalanceBefore", outputTokenBalanceBefore);

    // Execute swap tx
    const { approvalReceipts, swapReceipt, depositEvent } =
      await executeApprovalAndDeposit(swapQuote);
    console.log("depositEvent", depositEvent);
    console.log("swapReceipt", swapReceipt);
    console.log("approvalReceipts", approvalReceipts);

    // If `exclusiveRelayer` is set in the returned swap quote, we need to wait until the
    // exclusivity period has passed before our mock relayer can fill the deposit.
    const waitTimeBuffer = 60;
    const waitTimeSeconds =
      Math.max(swapQuote.expectedFillTime, 3) + waitTimeBuffer;
    await destinationClient.setNextBlockTimestamp({
      timestamp: BigInt(Math.floor(Date.now() / 1000) + waitTimeSeconds),
    });
    await destinationClient.mine({ blocks: 1 });

    // Set bridging funds for relayer
    await destinationClient.tevmDeal({
      erc20: swapQuote.steps.bridge.tokenOut.address as Address,
      account: e2eConfig.addresses.relayer,
      amount: TOKEN_FUND_AMOUNT,
    });

    // Fill the relay
    const { fillReceipt, fillEvent } = await executeFill({
      depositEvent,
      originChainId,
    });
    console.log("fillEvent", fillEvent);
    console.log("fillReceipt", fillReceipt);

    // Balances AFTER swap and fill executions
    const inputTokenBalanceAfter = await getBalance(
      originChainId,
      inputTokenAddress,
      depositor
    );
    const outputTokenBalanceAfter = await getBalance(
      destinationChainId,
      outputTokenAddress,
      depositor
    );

    // Balance diffs
    const inputTokenBalanceDiff =
      inputTokenBalanceBefore - inputTokenBalanceAfter;
    inputTokenBalanceAfter;
    const outputTokenBalanceDiff =
      outputTokenBalanceAfter - outputTokenBalanceBefore;
    outputTokenBalanceBefore;

    // Sanity checks based on the trade type
    if (tradeType === "exactInput") {
      expect(inputTokenBalanceDiff === amount).toBe(true);
      expect(
        outputTokenBalanceDiff >= BigInt(swapQuote.minOutputAmount.toString())
      ).toBe(true);
    } else if (tradeType === "exactOutput") {
      expect(outputTokenBalanceDiff === amount).toBe(true);
      expect(
        inputTokenBalanceDiff === BigInt(swapQuote.inputAmount.toString())
      ).toBe(true);
    } else if (tradeType === "minOutput") {
      expect(outputTokenBalanceDiff >= amount).toBe(true);
      expect(
        inputTokenBalanceDiff === BigInt(swapQuote.inputAmount.toString())
      ).toBe(true);
    }

    return {
      approvalReceipts,
      swapReceipt,
      depositEvent,
      fillReceipt,
      fillEvent,
    };
  }

  describe("B2B - existing configured depositor", () => {
    describe("exactInput", () => {
      it("should fetch, execute deposit, and fill the relay", async () => {
        await runEndToEnd("exactInput", B2B_BASE_TEST_CASE);
      }, 180_000);
    });

    describe.only("minOutput", () => {
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
});
