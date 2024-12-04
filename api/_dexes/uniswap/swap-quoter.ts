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
import { CHAIN_IDs } from "@across-protocol/constants";
import { utils } from "@across-protocol/sdk";

import { Swap } from "../types";
import { getSwapAndBridgeAddress } from "../utils";
import { getProdToken } from "./utils";
import { callViaMulticall3, getProvider } from "../../_utils";

// https://docs.uniswap.org/contracts/v3/reference/deployments/
const POOL_FACTORY_CONTRACT_ADDRESS = {
  [CHAIN_IDs.MAINNET]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  [CHAIN_IDs.OPTIMISM]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  [CHAIN_IDs.ARBITRUM]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  [CHAIN_IDs.BASE]: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
  [CHAIN_IDs.POLYGON]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
};
const QUOTER_CONTRACT_ADDRESS = {
  [CHAIN_IDs.MAINNET]: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
  [CHAIN_IDs.OPTIMISM]: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
  [CHAIN_IDs.ARBITRUM]: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
  [CHAIN_IDs.BASE]: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",
  [CHAIN_IDs.POLYGON]: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
};

type SwapParam = Omit<Swap, "recipient">;

export async function getUniswapQuoteWithSwapQuoter(swap: SwapParam) {
  const swapAndBridgeAddress = getSwapAndBridgeAddress(
    "uniswap",
    swap.tokenIn.chainId
  );

  const initialTokenIn = { ...swap.tokenIn };
  const initialTokenOut = { ...swap.tokenOut };

  // Always use mainnet tokens for retrieving quote, so that we can get equivalent quotes
  // for testnet tokens.
  swap.tokenIn = getProdToken(swap.tokenIn);
  swap.tokenOut = getProdToken(swap.tokenOut);

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
    FeeAmount.LOW,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  );

  const swapRoute = new Route([pool], tokenA, tokenB);

  const amountOut = await getOutputQuote(swap, swapRoute);

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(tokenA, swap.amount),
    outputAmount: CurrencyAmount.fromRawAmount(tokenB, JSBI.BigInt(amountOut)),
    // @TODO: Support other trade types
    tradeType: TradeType.EXACT_INPUT,
  });

  const options: SwapOptions = {
    slippageTolerance: new Percent(
      // max. slippage decimals is 2
      Number(swap.slippageTolerance.toFixed(2)) * 100,
      10_000
    ),
    // 20 minutes from the current Unix time
    deadline: utils.getCurrentTime() + 60 * 20,
    recipient: swapAndBridgeAddress,
  };

  const methodParameters = SwapRouter.swapCallParameters(
    [uncheckedTrade],
    options
  );

  // replace mainnet token addresses with initial token addresses in calldata
  methodParameters.calldata = methodParameters.calldata.replace(
    swap.tokenIn.address.toLowerCase().slice(2),
    initialTokenIn.address.toLowerCase().slice(2)
  );
  methodParameters.calldata = methodParameters.calldata.replace(
    swap.tokenOut.address.toLowerCase().slice(2),
    initialTokenOut.address.toLowerCase().slice(2)
  );

  return {
    minExpectedInputTokenAmount: ethers.utils
      .parseUnits(
        uncheckedTrade.minimumAmountOut(options.slippageTolerance).toExact(),
        swap.tokenOut.decimals
      )
      .toString(),
    routerCalldata: methodParameters.calldata,
    value: ethers.BigNumber.from(methodParameters.value).toString(),
    swapAndBridgeAddress,
    dex: "uniswap",
    slippage: swap.slippageTolerance,
  };
}

async function getOutputQuote(
  swap: SwapParam,
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
    // @TODO: Support other trade types
    TradeType.EXACT_INPUT,
    { useQuoterV2: true }
  );
  const quoteCallReturnData = await provider.call({
    to: QUOTER_CONTRACT_ADDRESS[swap.tokenIn.chainId],
    data: calldata,
  });

  return ethers.utils.defaultAbiCoder.decode(["uint256"], quoteCallReturnData);
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
  const poolContract = new ethers.Contract(
    computePoolAddress({
      factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS[tokenIn.chainId],
      tokenA: new Token(tokenIn.chainId, tokenIn.address, tokenIn.decimals),
      tokenB: new Token(tokenOut.chainId, tokenOut.address, tokenOut.decimals),
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
    token0,
    token1,
    fee,
    tickSpacing,
    liquidity,
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
