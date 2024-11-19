import { UniversalSwapAndBridge__factory } from "@across-protocol/contracts/dist/typechain";

import { ENABLED_ROUTES, getProvider } from "../_utils";
import {
  buildMulticallHandlerMessage,
  encodeDrainCalldata,
  encodeTransferCalldata,
  encodeWethWithdrawCalldata,
  getMultiCallHandlerAddress,
} from "../_multicall-handler";
import { CrossSwap } from "./types";

export class UnsupportedDex extends Error {
  constructor(dex: string) {
    super(`DEX/Aggregator ${dex} not supported`);
  }
}

export class UnsupportedDexOnChain extends Error {
  constructor(chainId: number, dex: string) {
    super(`DEX/Aggregator ${dex} not supported on chain ${chainId}`);
  }
}

export class NoSwapRouteError extends Error {
  constructor(args: {
    dex: string;
    tokenInSymbol: string;
    tokenOutSymbol: string;
    chainId: number;
    swapType: string;
  }) {
    super(
      `No ${args.dex} swap route found for '${args.swapType}' ${args.tokenInSymbol} to ${args.tokenOutSymbol} on chain ${args.chainId}`
    );
  }
}

export const swapAndBridgeDexes = Object.keys(
  ENABLED_ROUTES.swapAndBridgeAddresses
);

export function getSwapAndBridgeAddress(dex: string, chainId: number) {
  if (!_isDexSupported(dex)) {
    throw new UnsupportedDex(dex);
  }

  const address = (
    ENABLED_ROUTES.swapAndBridgeAddresses[dex] as Record<string, string>
  )?.[chainId];
  if (!address) {
    throw new UnsupportedDexOnChain(chainId, dex);
  }
  return address;
}

export function getSwapAndBridge(dex: string, chainId: number) {
  const swapAndBridgeAddress = getSwapAndBridgeAddress(dex, chainId);

  return UniversalSwapAndBridge__factory.connect(
    swapAndBridgeAddress,
    getProvider(chainId)
  );
}

function _isDexSupported(
  dex: string
): dex is keyof typeof ENABLED_ROUTES.swapAndBridgeAddresses {
  return swapAndBridgeDexes.includes(dex);
}

/**
 * This builds a cross-chain message for a (any/bridgeable)-to-bridgeable cross swap
 * with a specific amount of output tokens that the recipient will receive. Excess
 * tokens are refunded to the depositor.
 */
export function buildExactOutputBridgeTokenMessage(crossSwap: CrossSwap) {
  const transferActions = crossSwap.isOutputNative
    ? // WETH unwrap to ETH
      [
        {
          target: crossSwap.outputToken.address,
          callData: encodeWethWithdrawCalldata(crossSwap.amount),
          value: "0",
        },
        {
          target: crossSwap.recipient,
          callData: "0x",
          value: crossSwap.amount.toString(),
        },
      ]
    : // ERC-20 token transfer
      [
        {
          target: crossSwap.outputToken.address,
          callData: encodeTransferCalldata(
            crossSwap.recipient,
            crossSwap.amount
          ),
          value: "0",
        },
      ];
  return buildMulticallHandlerMessage({
    // @TODO: handle fallback recipient for params `refundOnOrigin` and `refundAddress`
    fallbackRecipient: crossSwap.depositor,
    actions: [
      ...transferActions,
      // drain remaining bridgeable output tokens from MultiCallHandler contract
      {
        target: getMultiCallHandlerAddress(crossSwap.outputToken.chainId),
        callData: encodeDrainCalldata(
          crossSwap.outputToken.address,
          crossSwap.depositor
        ),
        value: "0",
      },
    ],
  });
}
