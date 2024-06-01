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

import { callViaMulticall3, getProvider } from "../_utils";
import { TOKEN_SYMBOLS_MAP } from "../_constants";
import {
  AcrossSwap,
  SwapQuoteAndCalldata,
  Token as AcrossToken,
} from "./types";
import { getSwapAndBridgeAddress } from "./utils";

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

// Maps testnet chain IDs to their main counterparts. Used to get the mainnet token
// info for testnet tokens.
const TESTNET_TO_MAINNET = {
  [CHAIN_IDs.SEPOLIA]: CHAIN_IDs.MAINNET,
  [CHAIN_IDs.BASE_SEPOLIA]: CHAIN_IDs.BASE,
  [CHAIN_IDs.OPTIMISM_SEPOLIA]: CHAIN_IDs.OPTIMISM,
  [CHAIN_IDs.ARBITRUM_SEPOLIA]: CHAIN_IDs.ARBITRUM,
};

export async function getUniswapQuoteAndCalldata(
  swap: AcrossSwap
): Promise<SwapQuoteAndCalldata> {
  const swapAndBridgeAddress = getSwapAndBridgeAddress(
    "uniswap",
    swap.swapToken.chainId
  );

  const initialSwapToken = { ...swap.swapToken };
  const initialAcrossInputToken = { ...swap.acrossInputToken };
  // Always use mainnet tokens for retrieving quote, so that we can get equivalent quotes
  // for testnet tokens.
  swap.swapToken = getMainnetToken(swap.swapToken);
  swap.acrossInputToken = getMainnetToken(swap.acrossInputToken);

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
    slippageTolerance: new Percent(
      // max. slippage decimals is 2
      Number(swap.slippage.toFixed(2)) * 100,
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
    swap.swapToken.address.toLowerCase().slice(2),
    initialSwapToken.address.toLowerCase().slice(2)
  );
  methodParameters.calldata = methodParameters.calldata.replace(
    swap.acrossInputToken.address.toLowerCase().slice(2),
    initialAcrossInputToken.address.toLowerCase().slice(2)
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
    TradeType.EXACT_INPUT,
    { useQuoterV2: true }
  );

  const quoteCallReturnData = await provider.call({
    to: QUOTER_CONTRACT_ADDRESS[swap.swapToken.chainId],
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
      factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS[swapToken.chainId],
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

function getMainnetToken(token: AcrossToken) {
  const mainnetChainId = TESTNET_TO_MAINNET[token.chainId] || token.chainId;

  const mainnetToken =
    TOKEN_SYMBOLS_MAP[token.symbol as keyof typeof TOKEN_SYMBOLS_MAP];
  const mainnetTokenAddress = mainnetToken?.addresses[mainnetChainId];

  if (!mainnetToken || !mainnetTokenAddress) {
    throw new Error(
      `Mainnet token not found for ${token.symbol} on chain ${token.chainId}`
    );
  }

  return {
    ...mainnetToken,
    chainId: mainnetChainId,
    address: mainnetTokenAddress,
  };
}
