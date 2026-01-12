import axios from "axios";
import { expect } from "vitest";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
import { Address, parseUnits, PrivateKeyAccount } from "viem";

import { e2eConfig, JEST_TIMEOUT_MS } from "./config";
import { executeApprovalAndDeposit, type SwapQuoteResponse } from "./deposit";
import { executeFill } from "./fill";
import { getBalance } from "./token";

export type TradeType = "exactInput" | "exactOutput" | "minOutput";

const SWAP_API_BASE_URL = e2eConfig.swapApiBaseUrl;
const SWAP_API_URL = `${SWAP_API_BASE_URL}/api/swap/approval`;
const TOKEN_FUND_AMOUNT = 1_000_000; // Unparsed amount of tokens to fund the depositor and relayer, e.g. 1_000_000 USDC
const SLIPPAGE = "auto";

export const USDS = {
  symbol: "USDS",
  decimals: 18,
  addresses: {
    [CHAIN_IDs.BASE]: "0x820C137fa70C8691f0e44Dc420a5e53c168921Dc",
  },
};

export const B2B_BASE_TEST_CASE = {
  amounts: {
    exactInput: parseUnits("1", 6), // 1 USDC
    exactOutput: parseUnits("1", 6), // 1 USDC
    minOutput: parseUnits("1", 6), // 1 USDC
  },
  inputToken: TOKEN_SYMBOLS_MAP.USDC,
  outputToken: TOKEN_SYMBOLS_MAP.USDC,
  originChainId: CHAIN_IDs.BASE,
  destinationChainId: CHAIN_IDs.OPTIMISM,
  refundOnOrigin: true,
  slippage: SLIPPAGE,
} as const;

export const B2A_BASE_TEST_CASE = {
  amounts: {
    exactInput: parseUnits("1", 6), // 1 USDC
    exactOutput: parseUnits("1", 18), // 1 USDS
    minOutput: parseUnits("1", 18), // 1 USDS
  },
  inputToken: TOKEN_SYMBOLS_MAP.USDC,
  outputToken: USDS,
  originChainId: CHAIN_IDs.OPTIMISM,
  destinationChainId: CHAIN_IDs.BASE,
  refundOnOrigin: true,
  slippage: SLIPPAGE,
} as const;

export const A2B_BASE_TEST_CASE = {
  amounts: {
    exactInput: parseUnits("1", 18), // 1 USDS
    exactOutput: parseUnits("1", 6), // 1 USDC
    minOutput: parseUnits("1", 6), // 1 USDC
  },
  inputToken: USDS,
  outputToken: TOKEN_SYMBOLS_MAP.USDC,
  originChainId: CHAIN_IDs.BASE,
  destinationChainId: CHAIN_IDs.OPTIMISM,
  refundOnOrigin: true,
  slippage: SLIPPAGE,
} as const;

export const A2A_BASE_TEST_CASE = {
  amounts: {
    exactInput: parseUnits("1", 6), // 1 USDC.e
    exactOutput: parseUnits("1", 18), // 1 USDS
    minOutput: parseUnits("1", 18), // 1 USDS
  },
  inputToken: TOKEN_SYMBOLS_MAP.OP,
  outputToken: USDS,
  originChainId: CHAIN_IDs.OPTIMISM,
  destinationChainId: CHAIN_IDs.BASE,
  refundOnOrigin: true,
  slippage: 0.1, // Explicitly set slippage for A2A test case
} as const;

export type EndToEndTestCase =
  | typeof B2B_BASE_TEST_CASE
  | typeof B2A_BASE_TEST_CASE
  | typeof A2B_BASE_TEST_CASE
  | typeof A2A_BASE_TEST_CASE;

export { JEST_TIMEOUT_MS };

export async function fetchSwapQuote(params: {
  amount: string;
  tradeType: TradeType;
  inputToken: string;
  outputToken: string;
  originChainId: number;
  destinationChainId: number;
  depositor: string;
  recipient: string;
  slippage: number | "auto";
  refundOnOrigin: boolean;
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

export async function prepEndToEndExecution(
  tradeType: TradeType,
  testCase: EndToEndTestCase,
  opts?: { freshDepositorWallet?: PrivateKeyAccount }
) {
  const {
    originChainId,
    destinationChainId,
    inputToken,
    outputToken,
    amounts,
    slippage,
    refundOnOrigin,
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
  await Promise.all([originClient.tevmReady(), destinationClient.tevmReady()]);

  // Set funds for depositor
  await originClient.tevmDeal({
    erc20: inputTokenAddress,
    account: depositor,
    amount: parseUnits(TOKEN_FUND_AMOUNT.toString(), inputToken.decimals),
  });
  await originClient.tevmMine({ blockCount: 1 });

  const [swapQuote, inputTokenBalanceBefore, outputTokenBalanceBefore] =
    await Promise.all([
      fetchSwapQuote({
        amount: amount.toString(),
        tradeType,
        inputToken: inputTokenAddress,
        outputToken: outputTokenAddress,
        originChainId,
        destinationChainId,
        depositor,
        recipient,
        slippage,
        refundOnOrigin,
      }),
      getBalance(originChainId, inputTokenAddress, depositor),
      getBalance(destinationChainId, outputTokenAddress, recipient),
    ]);

  return {
    originChainId,
    destinationChainId,
    inputTokenAddress,
    outputTokenAddress,
    depositor,
    recipient,
    swapQuote,
    inputTokenBalanceBefore,
    outputTokenBalanceBefore,
    amount,
    slippage,
    originClient,
    destinationClient,
  };
}

export async function runEndToEnd(
  tradeType: TradeType,
  testCase: EndToEndTestCase,
  opts?: { freshDepositorWallet?: PrivateKeyAccount }
) {
  const {
    originChainId,
    destinationChainId,
    inputTokenAddress,
    outputTokenAddress,
    depositor,
    recipient,
    swapQuote,
    inputTokenBalanceBefore,
    outputTokenBalanceBefore,
    amount,
    originClient,
    destinationClient,
  } = await prepEndToEndExecution(tradeType, testCase, opts);

  // Execute swap tx
  const { approvalReceipts, swapReceipt, depositEvent } =
    await executeApprovalAndDeposit(swapQuote, originClient);

  // Fill the relay
  await executeFill({
    depositEvent,
    originChainId,
    destinationClient,
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
