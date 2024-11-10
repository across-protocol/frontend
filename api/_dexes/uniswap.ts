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
import { getSwapAndBridgeAddress, NoSwapRouteError } from "./utils";

// Taken from here: https://docs.uniswap.org/contracts/v3/reference/deployments/
export const SWAP_ROUTER_02_ADDRESS = {
  [CHAIN_IDs.ARBITRUM]: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  [CHAIN_IDs.BASE]: "0x2626664c2603336E57B271c5C0b26F421741e481",
  [CHAIN_IDs.BLAST]: "0x549FEB8c9bd4c12Ad2AB27022dA12492aC452B66",
  [CHAIN_IDs.MAINNET]: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  [CHAIN_IDs.OPTIMISM]: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  [CHAIN_IDs.POLYGON]: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  [CHAIN_IDs.WORLD_CHAIN]: "0x091AD9e2e6e5eD44c1c66dB50e49A601F9f36cF6",
  [CHAIN_IDs.ZK_SYNC]: "0x99c56385daBCE3E81d8499d0b8d0257aBC07E8A3",
  [CHAIN_IDs.ZORA]: "0x7De04c96BE5159c3b5CeffC82aa176dc81281557",
};

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
    throw new NoSwapRouteError({
      dex: "uniswap",
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

  console.log("amountCurrency", amountCurrency);
  console.log("quoteCurrency", quoteCurrency);

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
    throw new NoSwapRouteError({
      dex: "uniswap",
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
