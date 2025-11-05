import { Token, TradeType, CurrencyAmount, Currency } from "@uniswap/sdk-core";
import {
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapType,
} from "@uniswap/smart-order-router";
import { SwapRouter as SwapRouter02 } from "@uniswap/router-sdk";
import {
  computePoolAddress,
  FeeAmount,
  SwapQuoter,
  Route,
  Trade,
  Pool,
} from "@uniswap/v3-sdk";
import IUniswapV3PoolABI from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import { ethers } from "ethers";
import JSBI from "jsbi";
import { utils } from "@across-protocol/sdk";

import { Swap, SwapQuote } from "../../types";
import { getProvider, callViaMulticall3 } from "../../../_utils";
import { NoSwapRouteError } from "../../../_swap-and-bridge";
import { floatToPercent } from "./conversion";
import {
  POOL_FACTORY_CONTRACT_ADDRESS,
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_02_ADDRESS,
  POOL_ADDRESS,
} from "./addresses";
import { getSlippage } from "../../../_slippage";

type SwapParam = Omit<Swap, "type">;

export async function getUniswapQuoteWithSwapQuoterFromSdk(
  swap: SwapParam,
  tradeType: TradeType
): Promise<SwapQuote> {
  const slippageTolerance = getSlippage({
    tokenIn: swap.tokenIn,
    tokenOut: swap.tokenOut,
    slippageTolerance: swap.slippageTolerance,
    originOrDestination: swap.originOrDestination,
  });
  const options = getOptions({
    recipient: swap.recipient,
    slippageTolerance,
  });

  const poolInfo = await getPoolInfo(swap);
  const tokenA = new Token(
    swap.tokenIn.chainId,
    swap.tokenIn.address,
    swap.tokenIn.decimals
  );
  const tokenB = new Token(
    swap.tokenOut.chainId,
    swap.tokenOut.address,
    swap.tokenOut.decimals
  );
  const pool = new Pool(
    tokenA,
    tokenB,
    poolInfo.fee,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  );
  const swapRoute = new Route([pool], tokenA, tokenB);

  const quoteAmount = JSBI.BigInt(
    await getQuoteAmount(swap, tradeType, swapRoute)
  );
  const inputAmount =
    tradeType === TradeType.EXACT_INPUT ? swap.amount : quoteAmount;
  const outputAmount =
    tradeType === TradeType.EXACT_INPUT ? quoteAmount : swap.amount;

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(tokenA, inputAmount),
    outputAmount: CurrencyAmount.fromRawAmount(tokenB, outputAmount),
    tradeType,
  });

  const methodParameters = SwapRouter02.swapCallParameters(
    [uncheckedTrade],
    options
  );

  const swapRouter02Address = SWAP_ROUTER_02_ADDRESS[swap.chainId];

  if (!swapRouter02Address) {
    throw new Error(
      `SwapRouter02 address not found for chain id ${swap.chainId}`
    );
  }

  const swapQuote = {
    tokenIn: swap.tokenIn,
    tokenOut: swap.tokenOut,
    maximumAmountIn: ethers.utils.parseUnits(
      uncheckedTrade.maximumAmountIn(options.slippageTolerance).toExact(),
      swap.tokenIn.decimals
    ),
    minAmountOut: ethers.utils.parseUnits(
      uncheckedTrade.minimumAmountOut(options.slippageTolerance).toExact(),
      swap.tokenOut.decimals
    ),
    expectedAmountOut: ethers.utils.parseUnits(
      uncheckedTrade.outputAmount.toExact(),
      swap.tokenOut.decimals
    ),
    expectedAmountIn: ethers.utils.parseUnits(
      uncheckedTrade.inputAmount.toExact(),
      swap.tokenIn.decimals
    ),
    slippageTolerance,
    swapTxns: [
      {
        ecosystem: "evm" as const,
        to: swapRouter02Address,
        data: methodParameters.calldata,
        value: methodParameters.value,
      },
    ],
    swapProvider: {
      name: "uniswap/v3-sdk/swap-quoter",
      sources: ["uniswap_v3"],
    },
  };

  return swapQuote;
}

export async function getUniswapQuoteWithSwapRouter02FromSdk(
  swap: SwapParam,
  tradeType: TradeType
): Promise<SwapQuote> {
  const slippageTolerance = getSlippage({
    tokenIn: swap.tokenIn,
    tokenOut: swap.tokenOut,
    slippageTolerance: swap.slippageTolerance,
    originOrDestination: swap.originOrDestination,
  });
  const { router, options } = getSwapRouter02AndOptions({
    chainId: swap.chainId,
    recipient: swap.recipient,
    slippageTolerance,
  });

  const amountCurrency =
    tradeType === TradeType.EXACT_INPUT ? swap.tokenIn : swap.tokenOut;
  const quoteCurrency =
    tradeType === TradeType.EXACT_INPUT ? swap.tokenOut : swap.tokenIn;

  const route = await router.route(
    CurrencyAmount.fromRawAmount(
      new Token(
        amountCurrency.chainId,
        amountCurrency.address,
        amountCurrency.decimals
      ),
      swap.amount
    ),
    new Token(
      quoteCurrency.chainId,
      quoteCurrency.address,
      quoteCurrency.decimals
    ),
    tradeType,
    options
  );

  if (!route || !route.methodParameters) {
    throw new NoSwapRouteError({
      dex: "uniswap",
      tokenInSymbol: swap.tokenIn.symbol,
      tokenOutSymbol: swap.tokenOut.symbol,
      chainId: swap.chainId,
      swapType:
        tradeType === TradeType.EXACT_INPUT ? "EXACT_INPUT" : "EXACT_OUTPUT",
    });
  }

  const swapQuote = {
    tokenIn: swap.tokenIn,
    tokenOut: swap.tokenOut,
    maximumAmountIn: ethers.utils.parseUnits(
      route.trade.maximumAmountIn(options.slippageTolerance).toExact(),
      swap.tokenIn.decimals
    ),
    minAmountOut: ethers.utils.parseUnits(
      route.trade.minimumAmountOut(options.slippageTolerance).toExact(),
      swap.tokenOut.decimals
    ),
    expectedAmountOut: ethers.utils.parseUnits(
      route.trade.outputAmount.toExact(),
      swap.tokenOut.decimals
    ),
    expectedAmountIn: ethers.utils.parseUnits(
      route.trade.inputAmount.toExact(),
      swap.tokenIn.decimals
    ),
    slippageTolerance,
    swapTxns: [
      {
        ecosystem: "evm" as const,
        to: route.methodParameters.to,
        data: route.methodParameters.calldata,
        value: route.methodParameters.value,
      },
    ],
    swapProvider: {
      name: "uniswap/v3-sdk/swap-router-02",
      sources: ["uniswap_v3"],
    },
  };

  return swapQuote;
}

function getSwapRouter02AndOptions(params: {
  chainId: number;
  recipient: string;
  slippageTolerance: number;
}) {
  const router = getSwapRouter02(params.chainId);
  const options = getOptions(params);
  return {
    router,
    options,
  };
}

function getOptions(params: {
  recipient: string;
  slippageTolerance: number;
}): SwapOptionsSwapRouter02 {
  const options: SwapOptionsSwapRouter02 = {
    recipient: params.recipient,
    deadline: utils.getCurrentTime() + 30 * 60, // 30 minutes from now
    type: SwapType.SWAP_ROUTER_02,
    slippageTolerance: floatToPercent(params.slippageTolerance),
  };
  return options;
}

const swapRouterCache = new Map<number, AlphaRouter>();
function getSwapRouter02(chainId: number) {
  const provider = getProvider(chainId);
  if (!swapRouterCache.has(chainId)) {
    swapRouterCache.set(chainId, new AlphaRouter({ chainId, provider }));
  }
  return swapRouterCache.get(chainId)!;
}

async function getPoolInfo({ tokenIn, tokenOut }: SwapParam): Promise<{
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  sqrtPriceX96: ethers.BigNumber;
  liquidity: ethers.BigNumber;
  tick: number;
}> {
  const provider = getProvider(tokenIn.chainId);
  const symbolIn = tokenIn.symbol === "ETH" ? "WETH" : tokenIn.symbol;
  const symbolOut = tokenOut.symbol === "ETH" ? "WETH" : tokenOut.symbol;
  const sortedTokenSymbols = [symbolIn, symbolOut].sort();
  const poolKey = `${sortedTokenSymbols[0]}_${sortedTokenSymbols[1]}`;
  const poolAddress =
    POOL_ADDRESS[tokenIn.chainId]?.[
      poolKey as keyof (typeof POOL_ADDRESS)[number]
    ] ??
    computePoolAddress({
      factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS[tokenIn.chainId],
      tokenA: new Token(tokenIn.chainId, tokenIn.address, tokenIn.decimals),
      tokenB: new Token(tokenOut.chainId, tokenOut.address, tokenOut.decimals),
      fee: FeeAmount.LOW,
    });
  const poolContract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI.abi,
    provider
  );
  const poolMethods = [
    "token0",
    "token1",
    "fee",
    "tickSpacing",
    "liquidity",
    "slot0",
  ];
  const [token0, token1, fee, tickSpacing, liquidity, slot0] =
    await callViaMulticall3(
      provider,
      poolMethods.map((method) => ({
        contract: poolContract,
        functionName: method,
      }))
    );

  return {
    token0: token0[0],
    token1: token1[0],
    fee: fee[0],
    tickSpacing: tickSpacing[0],
    liquidity: liquidity[0],
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  } as unknown as {
    token0: string;
    token1: string;
    fee: number;
    tickSpacing: number;
    sqrtPriceX96: ethers.BigNumber;
    liquidity: ethers.BigNumber;
    tick: number;
  };
}

async function getQuoteAmount(
  swap: SwapParam,
  tradeType: TradeType,
  route: Route<Currency, Currency>
) {
  const provider = getProvider(route.chainId);
  const { calldata } = SwapQuoter.quoteCallParameters(
    route,
    CurrencyAmount.fromRawAmount(
      new Token(
        swap.tokenIn.chainId,
        swap.tokenIn.address,
        swap.tokenIn.decimals
      ),
      swap.amount
    ),
    tradeType,
    { useQuoterV2: true }
  );
  const quoteCallReturnData = await provider.call({
    to: QUOTER_CONTRACT_ADDRESS[swap.tokenIn.chainId],
    data: calldata,
  });

  return ethers.utils.defaultAbiCoder.decode(["uint256"], quoteCallReturnData);
}
