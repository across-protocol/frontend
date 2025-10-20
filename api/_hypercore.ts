import { BigNumber, ethers } from "ethers";
import axios from "axios";

import { getProvider } from "./_providers";
import { CHAIN_IDs } from "./_constants";

const HYPERLIQUID_API_BASE_URL = "https://api.hyperliquid.xyz";

// Maps <TOKEN_IN_SYMBOL>/<TOKEN_OUT_SYMBOL> to the coin identifier to be used to
// retrieve the L2 order book for a given pair via the Hyperliquid API.
// See: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint#perpetuals-vs-spot
const L2_ORDER_BOOK_COIN_MAP: Record<string, string> = {
  "USDH/USDC": "@230",
};

// Contract used to query Hypercore balances from EVM
export const CORE_BALANCE_SYSTEM_PRECOMPILE =
  "0x0000000000000000000000000000000000000801";

// Contract used to check if an account exists on Hypercore.
export const CORE_USER_EXISTS_PRECOMPILE_ADDRESS =
  "0x0000000000000000000000000000000000000810";

// CoreWriter contract on EVM that can be used to interact with Hypercore.
export const CORE_WRITER_EVM_ADDRESS =
  "0x3333333333333333333333333333333333333333";

// CoreWriter exposes a single function that charges 20k gas to send an instruction on Hypercore.
export const CORE_WRITER_ABI = ["function sendRawAction(bytes)"];

// To transfer Core balance, a 'spotSend' action must be specified in the payload to sendRawAction:
export const SPOT_SEND_PREFIX_BYTES = ethers.utils.hexlify([
  1, // byte 0: version, must be 1
  // bytes 1-3: unique action index as described here:
  // https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/interacting-with-hypercore#corewriter-contract
  0,
  0,
  6, // action index of spotSend is 6, so bytes 1-3 are 006
]);

export function encodeTransferOnCoreCalldata(params: {
  recipientAddress: string;
  tokenSystemAddress: string;
  amount: BigNumber;
}) {
  const { recipientAddress, tokenSystemAddress, amount } = params;
  return encodeSendRawActionCalldata(
    getSpotSendBytesForTransferOnCore({
      recipientAddress,
      tokenSystemAddress,
      amount,
    })
  );
}

export function encodeSendRawActionCalldata(action: string) {
  const coreWriter = new ethers.Contract(
    CORE_WRITER_EVM_ADDRESS,
    CORE_WRITER_ABI
  );
  return coreWriter.interface.encodeFunctionData("sendRawAction", [action]);
}

export function getSpotSendBytesForTransferOnCore(params: {
  recipientAddress: string;
  tokenSystemAddress: string;
  amount: BigNumber;
}) {
  const { recipientAddress, tokenSystemAddress, amount } = params;
  const tokenIndex = parseInt(tokenSystemAddress.replace("0x20", ""), 16);
  const transferOnCoreCalldata = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint64", "uint64"],
    [recipientAddress, tokenIndex, amount]
  );
  return ethers.utils.hexlify(
    ethers.utils.concat([SPOT_SEND_PREFIX_BYTES, transferOnCoreCalldata])
  );
}

export async function getBalanceOnHyperCore(params: {
  account: string;
  tokenSystemAddress: string;
}) {
  const provider = getProvider(CHAIN_IDs.HYPEREVM);
  const tokenIndex = parseInt(
    params.tokenSystemAddress.replace("0x20", ""),
    16
  );
  const balanceCoreCalldata = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint64"],
    [params.account, tokenIndex]
  );
  const queryResult = await provider.call({
    to: CORE_BALANCE_SYSTEM_PRECOMPILE,
    data: balanceCoreCalldata,
  });
  const decodedQueryResult = ethers.utils.defaultAbiCoder.decode(
    ["uint64", "uint64", "uint64"], // total, hold, entryNtl
    queryResult
  );
  return BigNumber.from(decodedQueryResult[0].toString());
}

export async function accountExistsOnHyperCore(params: {
  account: string;
  chainId?: number;
}) {
  const chainId = params.chainId ?? CHAIN_IDs.HYPEREVM;

  if (![CHAIN_IDs.HYPEREVM, CHAIN_IDs.HYPEREVM_TESTNET].includes(chainId)) {
    throw new Error("Can't check account existence on non-HyperCore chain");
  }

  const provider = getProvider(chainId);

  const balanceCoreCalldata = ethers.utils.defaultAbiCoder.encode(
    ["address"],
    [params.account]
  );
  const queryResult = await provider.call({
    to: CORE_USER_EXISTS_PRECOMPILE_ADDRESS,
    data: balanceCoreCalldata,
  });
  const decodedQueryResult = ethers.utils.defaultAbiCoder.decode(
    ["bool"],
    queryResult
  );
  return Boolean(decodedQueryResult[0]);
}

// https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint#l2-book-snapshot
export async function getL2OrderBookForPair(params: {
  tokenInSymbol: string;
  tokenOutSymbol: string;
}) {
  const { tokenInSymbol, tokenOutSymbol } = params;

  // Try both directions since the pair might be stored either way
  let coin =
    L2_ORDER_BOOK_COIN_MAP[`${tokenInSymbol}/${tokenOutSymbol}`] ||
    L2_ORDER_BOOK_COIN_MAP[`${tokenOutSymbol}/${tokenInSymbol}`];

  if (!coin) {
    throw new Error(
      `No L2 order book coin found for pair ${tokenInSymbol}/${tokenOutSymbol}`
    );
  }

  const response = await axios.post<{
    coin: string;
    time: number;
    levels: [
      { px: string; sz: string; n: number }[], // bids sorted by price descending
      { px: string; sz: string; n: number }[], // asks sorted by price ascending
    ];
  }>(`${HYPERLIQUID_API_BASE_URL}/info`, {
    type: "l2Book",
    coin,
  });

  if (!response.data) {
    throw new Error(
      `Hyperliquid API: Unexpected L2OrderBook value '${response.data}'`
    );
  }

  if (response.data?.levels.length < 2) {
    throw new Error("Hyperliquid API: Unexpected L2OrderBook 'levels' length");
  }

  return response.data;
}

export type MarketOrderSimulationResult = {
  averageExecutionPrice: string; // Human-readable price
  inputAmount: BigNumber;
  outputAmount: BigNumber;
  slippagePercent: number;
  bestPrice: string; // Best available price (first level)
  levelsConsumed: number;
  fullyFilled: boolean;
};

/**
 * Simulates a market order by walking through the order book levels.
 * Calculates execution price, slippage, and output amounts.
 *
 * @param tokenIn - Token being sold
 * @param tokenOut - Token being bought
 * @param inputAmount - Amount of input token to sell (as BigNumber)
 * @returns Simulation result with execution details and slippage
 *
 * @example
 * // Simulate selling 1000 USDC for USDH
 * const result = await simulateMarketOrder({
 *   tokenIn: {
 *     symbol: "USDC",
 *     decimals: 8,
 *   },
 *   tokenOut: {
 *     symbol: "USDH",
 *     decimals: 8,
 *   },
 *   inputAmount: ethers.utils.parseUnits("1000", 8),
 * });
 */
export async function simulateMarketOrder(params: {
  tokenIn: {
    symbol: string;
    decimals: number;
  };
  tokenOut: {
    symbol: string;
    decimals: number;
  };
  inputAmount: BigNumber;
}): Promise<MarketOrderSimulationResult> {
  const { tokenIn, tokenOut, inputAmount } = params;

  const orderBook = await getL2OrderBookForPair({
    tokenInSymbol: tokenIn.symbol,
    tokenOutSymbol: tokenOut.symbol,
  });

  // Determine which side of the order book to use
  // We need to figure out the pair direction from L2_ORDER_BOOK_COIN_MAP
  const pairKey = `${tokenIn.symbol}/${tokenOut.symbol}`;
  const reversePairKey = `${tokenOut.symbol}/${tokenIn.symbol}`;

  let baseCurrency = "";

  if (L2_ORDER_BOOK_COIN_MAP[pairKey]) {
    // Normal direction: tokenIn/tokenOut exists in map
    baseCurrency = tokenIn.symbol;
  } else if (L2_ORDER_BOOK_COIN_MAP[reversePairKey]) {
    // Reverse direction: tokenOut/tokenIn exists in map
    baseCurrency = tokenOut.symbol;
  } else {
    throw new Error(
      `No L2 order book key configured for pair ${tokenIn.symbol}/${tokenOut.symbol}`
    );
  }

  // Determine which side to use:
  // - If buying base (quote → base): use asks
  // - If selling base (base → quote): use bids
  const isBuyingBase = tokenOut.symbol === baseCurrency;
  const levels = isBuyingBase ? orderBook.levels[1] : orderBook.levels[0]; // asks : bids

  if (levels.length === 0) {
    throw new Error(
      `No liquidity available for ${tokenIn.symbol}/${tokenOut.symbol}`
    );
  }

  // Get best price for slippage calculation
  const bestPrice = levels[0].px;

  // Walk through order book levels
  let remainingInput = inputAmount;
  let totalOutput = BigNumber.from(0);
  let levelsConsumed = 0;

  for (const level of levels) {
    if (remainingInput.lte(0)) break;

    levelsConsumed++;

    // Prices are returned by the API in a parsed format, e.g. 0.987 USDC
    const price = ethers.utils.parseUnits(level.px, tokenOut.decimals);
    // Level size is returned by the API in a parsed format, e.g. 1000 USDC
    const levelSize = ethers.utils.parseUnits(level.sz, tokenIn.decimals);

    if (isBuyingBase) {
      // Buying base with quote
      // We have quote currency (input) and want base currency (output)
      // price = quote per base, so base amount = quote amount / price

      // Calculate how much base currency is available at this level
      const baseAvailable = levelSize;

      // Calculate how much quote we need to buy this base
      const quoteNeeded = baseAvailable
        .mul(price)
        .div(ethers.utils.parseUnits("1", tokenOut.decimals));

      if (remainingInput.gte(quoteNeeded)) {
        // We can consume this entire level
        totalOutput = totalOutput.add(baseAvailable);
        remainingInput = remainingInput.sub(quoteNeeded);
      } else {
        // Partial fill - only consume part of this level
        const baseAmount = remainingInput
          .mul(ethers.utils.parseUnits("1", tokenOut.decimals))
          .div(price);
        totalOutput = totalOutput.add(baseAmount);
        remainingInput = BigNumber.from(0);
      }
    } else {
      // Selling base for quote
      // We have base currency (input) and want quote currency (output)
      // price = quote per base, so quote amount = base amount * price

      // Level size represents how much base can be sold at this price
      const baseAvailable = levelSize;

      if (remainingInput.gte(baseAvailable)) {
        // We can consume this entire level
        const quoteAmount = baseAvailable
          .mul(price)
          .div(ethers.utils.parseUnits("1", tokenIn.decimals));
        totalOutput = totalOutput.add(quoteAmount);
        remainingInput = remainingInput.sub(baseAvailable);
      } else {
        // Partial fill
        const quoteAmount = remainingInput
          .mul(price)
          .div(ethers.utils.parseUnits("1", tokenIn.decimals));
        totalOutput = totalOutput.add(quoteAmount);
        remainingInput = BigNumber.from(0);
      }
    }
  }

  const fullyFilled = remainingInput.eq(0);
  const filledInputAmount = inputAmount.sub(remainingInput);

  // Calculate average execution price
  // Price should be in same format as order book: quote per base
  let averageExecutionPrice = "0";
  if (filledInputAmount.gt(0) && totalOutput.gt(0)) {
    // Calculate with proper decimal handling
    const outputFormatted = parseFloat(
      ethers.utils.formatUnits(totalOutput, tokenOut.decimals)
    );
    const inputFormatted = parseFloat(
      ethers.utils.formatUnits(filledInputAmount, tokenIn.decimals)
    );

    // When buying base (input=quote, output=base): price = input/output (quote per base)
    // When selling base (input=base, output=quote): price = output/input (quote per base)
    if (isBuyingBase) {
      averageExecutionPrice = (inputFormatted / outputFormatted).toString();
    } else {
      averageExecutionPrice = (outputFormatted / inputFormatted).toString();
    }
  }

  // Calculate slippage percentage
  // slippage = ((avgPrice - bestPrice) / bestPrice) * 100
  let slippagePercent = 0;
  if (parseFloat(averageExecutionPrice) > 0 && parseFloat(bestPrice) > 0) {
    const avgPriceNum = parseFloat(averageExecutionPrice);
    const bestPriceNum = parseFloat(bestPrice);

    if (isBuyingBase) {
      // When buying, higher price is worse
      slippagePercent = ((avgPriceNum - bestPriceNum) / bestPriceNum) * 100;
    } else {
      // When selling, lower price is worse
      slippagePercent = ((bestPriceNum - avgPriceNum) / bestPriceNum) * 100;
    }
  }

  return {
    averageExecutionPrice,
    inputAmount: filledInputAmount,
    outputAmount: totalOutput,
    slippagePercent,
    bestPrice,
    levelsConsumed,
    fullyFilled,
  };
}
