import {
  SwapAndBridge__factory,
  UniversalSwapAndBridge__factory,
} from "@across-protocol/contracts";
import { BigNumber, constants } from "ethers";

import { ENABLED_ROUTES, getProvider } from "../_utils";
import {
  buildMulticallHandlerMessage,
  encodeDrainCalldata,
  encodeTransferCalldata,
  encodeWethWithdrawCalldata,
  getMultiCallHandlerAddress,
} from "../_multicall-handler";
import { CrossSwap } from "./types";

type SwapAndBridgeType = "SwapAndBridge" | "UniversalSwapAndBridge";

export class UnsupportedDex extends Error {
  constructor(dex: string, type: SwapAndBridgeType) {
    super(`DEX/Aggregator '${dex}' not supported for '${type}'`);
  }
}

export class UnsupportedDexOnChain extends Error {
  constructor(chainId: number, dex: string, type: SwapAndBridgeType) {
    super(
      `DEX/Aggregator '${dex}' not supported on chain ${chainId} for '${type}'`
    );
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

export const universalSwapAndBridgeDexes = Object.keys(
  ENABLED_ROUTES.universalSwapAndBridgeAddresses
);

export function getSwapAndBridgeAddress(dex: string, chainId: number) {
  if (!_isDexSupportedForSwapAndBridge(dex)) {
    throw new UnsupportedDex(dex, "SwapAndBridge");
  }

  const address = (
    ENABLED_ROUTES.swapAndBridgeAddresses[dex] as Record<string, string>
  )?.[chainId];
  if (!address) {
    throw new UnsupportedDexOnChain(chainId, dex, "SwapAndBridge");
  }
  return address;
}

export function getUniversalSwapAndBridgeAddress(dex: string, chainId: number) {
  if (!_isDexSupportedForUniversalSwapAndBridge(dex)) {
    throw new UnsupportedDex(dex, "UniversalSwapAndBridge");
  }

  const address = (
    ENABLED_ROUTES.universalSwapAndBridgeAddresses[dex] as Record<
      string,
      string
    >
  )?.[chainId];
  if (!address) {
    throw new UnsupportedDexOnChain(chainId, dex, "UniversalSwapAndBridge");
  }
  return address;
}

export function getSwapAndBridge(dex: string, chainId: number) {
  const swapAndBridgeAddress = getSwapAndBridgeAddress(dex, chainId);

  return SwapAndBridge__factory.connect(
    swapAndBridgeAddress,
    getProvider(chainId)
  );
}

export function getUniversalSwapAndBridge(dex: string, chainId: number) {
  const universalSwapAndBridgeAddress = getUniversalSwapAndBridgeAddress(
    dex,
    chainId
  );

  return UniversalSwapAndBridge__factory.connect(
    universalSwapAndBridgeAddress,
    getProvider(chainId)
  );
}

function _isDexSupportedForSwapAndBridge(
  dex: string
): dex is keyof typeof ENABLED_ROUTES.swapAndBridgeAddresses {
  return swapAndBridgeDexes.includes(dex);
}

function _isDexSupportedForUniversalSwapAndBridge(
  dex: string
): dex is keyof typeof ENABLED_ROUTES.universalSwapAndBridgeAddresses {
  return universalSwapAndBridgeDexes.includes(dex);
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
    fallbackRecipient: getFallbackRecipient(crossSwap),
    actions: [
      ...transferActions,
      // drain remaining bridgeable output tokens from MultiCallHandler contract
      {
        target: getMultiCallHandlerAddress(crossSwap.outputToken.chainId),
        callData: encodeDrainCalldata(
          crossSwap.outputToken.address,
          crossSwap.refundAddress ?? crossSwap.depositor
        ),
        value: "0",
      },
    ],
  });
}

/**
 * This builds a cross-chain message for a (any/bridgeable)-to-bridgeable cross swap
 * with a min. amount of output tokens that the recipient will receive.
 */
export function buildMinOutputBridgeTokenMessage(
  crossSwap: CrossSwap,
  unwrapAmount?: BigNumber
) {
  const transferActions = crossSwap.isOutputNative
    ? // WETH unwrap to ETH
      [
        {
          target: crossSwap.outputToken.address,
          callData: encodeWethWithdrawCalldata(
            unwrapAmount || crossSwap.amount
          ),
          value: "0",
        },
        {
          target: crossSwap.recipient,
          callData: "0x",
          value: (unwrapAmount || crossSwap.amount).toString(),
        },
      ]
    : // ERC-20 token transfer
      [];
  return buildMulticallHandlerMessage({
    fallbackRecipient: getFallbackRecipient(crossSwap),
    actions: [
      ...transferActions,
      // drain remaining bridgeable output tokens from MultiCallHandler contract
      {
        target: getMultiCallHandlerAddress(crossSwap.outputToken.chainId),
        callData: encodeDrainCalldata(
          crossSwap.outputToken.address,
          crossSwap.recipient
        ),
        value: "0",
      },
    ],
  });
}

export function getFallbackRecipient(crossSwap: CrossSwap) {
  return crossSwap.refundOnOrigin
    ? constants.AddressZero
    : crossSwap.refundAddress ?? crossSwap.depositor;
}
