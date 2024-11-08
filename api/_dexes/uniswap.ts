import { ethers } from "ethers";
import { CurrencyAmount, Percent, Token, TradeType } from "@uniswap/sdk-core";
import {
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapType,
} from "@uniswap/smart-order-router";
import { CHAIN_IDs } from "@across-protocol/constants";
import { utils } from "@across-protocol/sdk";

import { getProvider } from "../_utils";
import { TOKEN_SYMBOLS_MAP } from "../_constants";
import {
  OriginSwapQuoteAndCalldata,
  Token as AcrossToken,
  Swap,
} from "./types";
import { getSwapAndBridgeAddress } from "./utils";

// Maps testnet chain IDs to their main counterparts. Used to get the mainnet token
// info for testnet tokens.
const TESTNET_TO_MAINNET = {
  [CHAIN_IDs.SEPOLIA]: CHAIN_IDs.MAINNET,
  [CHAIN_IDs.BASE_SEPOLIA]: CHAIN_IDs.BASE,
  [CHAIN_IDs.OPTIMISM_SEPOLIA]: CHAIN_IDs.OPTIMISM,
  [CHAIN_IDs.ARBITRUM_SEPOLIA]: CHAIN_IDs.ARBITRUM,
};

export async function getUniswapQuoteForOriginSwapExactInput(
  swap: Omit<Swap, "recipient">
): Promise<OriginSwapQuoteAndCalldata> {
  const swapAndBridgeAddress = getSwapAndBridgeAddress("uniswap", swap.chainId);

  const initialTokenIn = { ...swap.tokenIn };
  const initialTokenOut = { ...swap.tokenOut };
  // Always use mainnet tokens for retrieving quote, so that we can get equivalent quotes
  // for testnet tokens.
  swap.tokenIn = getMainnetToken(swap.tokenIn);
  swap.tokenOut = getMainnetToken(swap.tokenOut);

  const { route, options } = await getUniswapQuote({
    ...swap,
    recipient: swapAndBridgeAddress,
  });

  if (!route.methodParameters) {
    throw new NoUniswapRouteError({
      tokenInSymbol: swap.tokenIn.symbol,
      tokenOutSymbol: swap.tokenOut.symbol,
      chainId: swap.chainId,
      swapType: "EXACT_INPUT",
    });
  }

  // replace mainnet token addresses with initial token addresses in calldata
  route.methodParameters.calldata = route.methodParameters.calldata.replace(
    swap.tokenIn.address.toLowerCase().slice(2),
    initialTokenIn.address.toLowerCase().slice(2)
  );
  route.methodParameters.calldata = route.methodParameters.calldata.replace(
    swap.tokenOut.address.toLowerCase().slice(2),
    initialTokenOut.address.toLowerCase().slice(2)
  );

  return {
    minExpectedInputTokenAmount: ethers.utils
      .parseUnits(
        route.trade.minimumAmountOut(options.slippageTolerance).toExact(),
        swap.tokenIn.decimals
      )
      .toString(),
    routerCalldata: route.methodParameters.calldata,
    value: ethers.BigNumber.from(route.methodParameters.value).toString(),
    swapAndBridgeAddress,
    dex: "uniswap",
    slippage: swap.slippageTolerance,
  };
}

export async function getUniswapQuote(swap: Swap) {
  const { router, options } = getSwapRouterAndOptions(swap);

  const amountCurrency =
    swap.type === "EXACT_INPUT" ? swap.tokenIn : swap.tokenOut;
  const quoteCurrency =
    swap.type === "EXACT_INPUT" ? swap.tokenOut : swap.tokenIn;

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
    swap.type === "EXACT_INPUT"
      ? TradeType.EXACT_INPUT
      : TradeType.EXACT_OUTPUT,
    options
  );

  if (!route || !route.methodParameters) {
    throw new NoUniswapRouteError({
      tokenInSymbol: swap.tokenIn.symbol,
      tokenOutSymbol: swap.tokenOut.symbol,
      chainId: swap.chainId,
      swapType: "EXACT_INPUT",
    });
  }

  return { route, options };
}

function getSwapRouterAndOptions(params: {
  chainId: number;
  recipient: string;
  slippageTolerance: number;
}) {
  const provider = getProvider(params.chainId);
  const router = new AlphaRouter({
    chainId: params.chainId,
    provider,
  });
  const options: SwapOptionsSwapRouter02 = {
    recipient: params.recipient,
    deadline: utils.getCurrentTime() + 30 * 60, // 30 minutes from now
    type: SwapType.SWAP_ROUTER_02,
    slippageTolerance: new Percent(
      // max. slippage decimals is 2
      Number(params.slippageTolerance.toFixed(2)) * 100,
      10_000
    ),
  };
  return {
    router,
    options,
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

class NoUniswapRouteError extends Error {
  constructor(args: {
    tokenInSymbol: string;
    tokenOutSymbol: string;
    chainId: number;
    swapType: string;
  }) {
    super(
      `No Uniswap swap route found for '${args.swapType}' ${args.tokenInSymbol} to ${args.tokenOutSymbol} on chain ${args.chainId}`
    );
    this.name = "NoSwapRouteError";
  }
}
