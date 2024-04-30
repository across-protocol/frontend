import { ethers } from "ethers";
import {
  FeeAmount,
  Pool,
  Route,
  SwapOptions,
  SwapQuoter,
  SwapRouter,
  Trade,
  computePoolAddress,
} from "@uniswap/v3-sdk";
import {
  Currency,
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
} from "@uniswap/sdk-core";
import JSBI from "jsbi";
import IUniswapV3PoolABI from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";

import { callViaMulticall3, getProvider } from "../_utils";
import { AcrossSwap, SwapQuoteAndCalldata } from "./types";
import { getSwapAndBridgeAddress } from "./utils";

const POOL_FACTORY_CONTRACT_ADDRESS =
  "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const QUOTER_CONTRACT_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";

export async function getUniswapQuoteAndCalldata(
  swap: AcrossSwap
): Promise<SwapQuoteAndCalldata> {
  const swapAndBridgeAddress = getSwapAndBridgeAddress(
    "uniswap",
    swap.swapToken.chainId
  );

  const poolInfo = await getPoolInfo(swap);
  const tokenA = new Token(
    swap.swapToken.chainId,
    swap.swapToken.address,
    swap.swapToken.decimals
  );
  const tokenB = new Token(
    swap.acrossInputToken.chainId,
    swap.acrossInputToken.address,
    swap.acrossInputToken.decimals
  );
  const pool = new Pool(
    tokenA,
    tokenB,
    FeeAmount.LOW,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  );

  const swapRoute = new Route([pool], tokenA, tokenB);

  const amountOut = await getOutputQuote(swap, swapRoute);

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(tokenA, swap.swapTokenAmount),
    outputAmount: CurrencyAmount.fromRawAmount(tokenB, JSBI.BigInt(amountOut)),
    tradeType: TradeType.EXACT_INPUT,
  });

  const options: SwapOptions = {
    slippageTolerance: new Percent(swap.slippage, 100),
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time,
    recipient: swapAndBridgeAddress,
  };

  const methodParameters = SwapRouter.swapCallParameters(
    [uncheckedTrade],
    options
  );

  return {
    minExpectedInputTokenAmount: ethers.utils
      .parseUnits(
        uncheckedTrade.minimumAmountOut(options.slippageTolerance).toExact(),
        swap.acrossInputToken.decimals
      )
      .toString(),
    routerCalldata: methodParameters.calldata,
    value: ethers.BigNumber.from(methodParameters.value).toString(),
    swapAndBridgeAddress,
    dex: "uniswap",
    slippage: swap.slippage,
  };
}

async function getOutputQuote(
  swap: AcrossSwap,
  route: Route<Currency, Currency>
) {
  const provider = getProvider(route.chainId);

  const { calldata } = SwapQuoter.quoteCallParameters(
    route,
    CurrencyAmount.fromRawAmount(
      new Token(
        swap.swapToken.chainId,
        swap.swapToken.address,
        swap.swapToken.decimals
      ),
      swap.swapTokenAmount
    ),
    TradeType.EXACT_INPUT
  );

  const quoteCallReturnData = await provider.call({
    to: QUOTER_CONTRACT_ADDRESS,
    data: calldata,
  });

  return ethers.utils.defaultAbiCoder.decode(["uint256"], quoteCallReturnData);
}

async function getPoolInfo({
  swapToken,
  acrossInputToken,
}: AcrossSwap): Promise<{
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  sqrtPriceX96: ethers.BigNumber;
  liquidity: ethers.BigNumber;
  tick: number;
}> {
  const provider = getProvider(swapToken.chainId);
  const poolContract = new ethers.Contract(
    computePoolAddress({
      factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
      tokenA: new Token(
        swapToken.chainId,
        swapToken.address,
        swapToken.decimals
      ),
      tokenB: new Token(
        acrossInputToken.chainId,
        acrossInputToken.address,
        acrossInputToken.decimals
      ),
      fee: FeeAmount.LOW,
    }),
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
    token0: token0 as unknown as string,
    token1: token1 as unknown as string,
    fee: fee as unknown as number,
    tickSpacing: tickSpacing as unknown as number,
    liquidity: liquidity as unknown as ethers.BigNumber,
    sqrtPriceX96: slot0[0] as unknown as ethers.BigNumber,
    tick: slot0[1] as unknown as number,
  };
}
