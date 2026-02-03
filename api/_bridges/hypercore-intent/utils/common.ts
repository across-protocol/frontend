import { BigNumber, ethers } from "ethers";

import { SwapQuote, Token } from "../../../_dexes/types";
import { AmountTooHighError, InvalidParamError } from "../../../_errors";
import { isToHyperCore } from "../../../_hypercore";
import { AppFee } from "../../../_dexes/utils";
import { CHAIN_IDs } from "../../../_constants";
import {
  getHyperliquidDepositHandlerAddress,
  BRIDGEABLE_OUTPUT_TOKEN_PER_OUTPUT_TOKEN,
  ERROR_MESSAGE_PREFIX,
  SUPPORTED_DESTINATION_CHAINS,
  SUPPORTED_ORIGIN_CHAINS,
  SUPPORTED_OUTPUT_TOKENS,
} from "./constants";
import { ConvertDecimals, maxBN, minBN } from "../../../_utils";
import { getCachedTokenBalance } from "../../../_balance";
import {
  getFullRelayers,
  getTransferRestrictedRelayers,
} from "../../../_relayer-address";

export function getHyperEvmChainId(destinationChainId: number) {
  return [CHAIN_IDs.HYPEREVM, CHAIN_IDs.HYPERCORE].includes(destinationChainId)
    ? CHAIN_IDs.HYPEREVM
    : CHAIN_IDs.HYPEREVM_TESTNET;
}

export function getBridgeableOutputToken(outputToken: Token): Token {
  const tokenDef = BRIDGEABLE_OUTPUT_TOKEN_PER_OUTPUT_TOKEN[outputToken.symbol];
  const hyperEvmChainId = getHyperEvmChainId(outputToken.chainId);
  return {
    ...tokenDef,
    address: tokenDef.addresses[hyperEvmChainId],
    chainId: hyperEvmChainId,
  };
}

export function getZeroBridgeFees(inputToken: Token) {
  const zeroBN = BigNumber.from(0);
  return {
    pct: zeroBN,
    amount: zeroBN,
    token: inputToken,
  };
}

export function getDepositRecipient(params: {
  outputToken: Token;
  recipient: string;
}) {
  const { outputToken, recipient } = params;

  // If to HyperCore, the recipient is our custom handler contract on HyperEVM.
  if (isToHyperCore(outputToken.chainId)) {
    const hyperEvmChainId = getHyperEvmChainId(outputToken.chainId);
    return getHyperliquidDepositHandlerAddress(hyperEvmChainId);
  }
  // Otherwise, the recipient is the normal EOA on HyperEVM.
  return recipient;
}

export function getDepositMessage(params: {
  outputToken: Token;
  recipient: string;
}) {
  const { outputToken, recipient } = params;
  if (isToHyperCore(outputToken.chainId)) {
    return ethers.utils.defaultAbiCoder.encode(["address"], [recipient]);
  }
  return "0x";
}

export async function assertSufficientBalanceOnHyperEvm(params: {
  amountHyperEvm: BigNumber;
  inputToken: Token;
  outputToken: Token;
}) {
  const hyperEvmChainId = getHyperEvmChainId(params.outputToken.chainId);
  const bridgeableOutputToken = getBridgeableOutputToken(params.outputToken);

  const fullRelayersDestinationChain = getFullRelayers(hyperEvmChainId);
  const transferRestrictedRelayers = getTransferRestrictedRelayers(
    hyperEvmChainId,
    bridgeableOutputToken.symbol
  );
  const relayerAddresses = Array.from(
    new Set([...fullRelayersDestinationChain, ...transferRestrictedRelayers])
  );
  const relayerBalances = await Promise.all(
    relayerAddresses.map((relayer) =>
      getCachedTokenBalance(
        hyperEvmChainId,
        relayer,
        bridgeableOutputToken.address
      )
    )
  );
  const maxBalance = maxBN(...relayerBalances);
  const maxAvailableBalance = ConvertDecimals(
    bridgeableOutputToken.decimals,
    params.inputToken.decimals
  )(maxBalance);

  const MAX_USDH_DEPOSIT_LIMIT = ethers.utils.parseUnits(
    "200000",
    bridgeableOutputToken.decimals
  );
  const maxDeposit: BigNumber = minBN(
    maxAvailableBalance,
    MAX_USDH_DEPOSIT_LIMIT
  );

  if (params.amountHyperEvm.gt(maxDeposit)) {
    throw new AmountTooHighError({
      message: `${
        ERROR_MESSAGE_PREFIX
      }: Amount exceeds max. deposit limit ${ethers.utils.formatUnits(
        maxDeposit,
        params.inputToken.decimals
      )} ${params.inputToken.symbol} on HyperEVM`,
    });
  }
}

export function assertNoOriginSwap(params: {
  originSwapQuote?: SwapQuote;
  errorMessagePrefix: string;
}) {
  const { originSwapQuote, errorMessagePrefix } = params;

  if (originSwapQuote) {
    throw new InvalidParamError({
      message: `${errorMessagePrefix}: Origin swap is not supported`,
    });
  }
}

export function assertNoDestinationSwap(params: {
  destinationSwapQuote?: SwapQuote;
  errorMessagePrefix: string;
}) {
  const { destinationSwapQuote, errorMessagePrefix } = params;

  if (destinationSwapQuote) {
    throw new InvalidParamError({
      message: `${errorMessagePrefix}: Destination swap is not supported`,
    });
  }
}

export function assertNoSwaps(params: {
  originSwapQuote?: SwapQuote;
  destinationSwapQuote?: SwapQuote;
  errorMessagePrefix: string;
}) {
  const { originSwapQuote, destinationSwapQuote, errorMessagePrefix } = params;

  assertNoOriginSwap({ originSwapQuote, errorMessagePrefix });
  assertNoDestinationSwap({ destinationSwapQuote, errorMessagePrefix });
}

export function assertNoAppFee(params: {
  appFee?: AppFee;
  errorMessagePrefix: string;
}) {
  const { appFee, errorMessagePrefix } = params;

  if (appFee?.feeAmount.gt(0)) {
    throw new InvalidParamError({
      message: `${errorMessagePrefix}: App fee is not supported`,
    });
  }
}

export function assertDepositorAndRecipientAreTheSame(params: {
  depositor: string;
  recipient: string;
  errorMessagePrefix: string;
}) {
  const { depositor, recipient, errorMessagePrefix } = params;

  if (depositor !== recipient) {
    throw new InvalidParamError({
      message: `${errorMessagePrefix}: Depositor and recipient must be the same`,
    });
  }
}

export function isRouteSupported(params: {
  inputToken: Token;
  outputToken: Token;
}) {
  if (!SUPPORTED_ORIGIN_CHAINS.includes(params.inputToken.chainId)) {
    return false;
  }

  if (SUPPORTED_DESTINATION_CHAINS.includes(params.outputToken.chainId)) {
    const supportedOutputToken = SUPPORTED_OUTPUT_TOKENS.find(
      (token) =>
        token.addresses[params.outputToken.chainId]?.toLowerCase() ===
        params.outputToken.address.toLowerCase()
    );

    if (!supportedOutputToken) {
      return false;
    }

    // For A2B flows: any input token is allowed as long as output token is supported
    // For B2B flows: input token must also be in the supported list
    // We support both, so as long as the output token is supported, the route is valid
    return true;
  }

  return false;
}

export function assertSupportedRoute(params: {
  inputToken: Token;
  outputToken: Token;
}) {
  if (!isRouteSupported(params)) {
    throw new InvalidParamError({
      message: `${ERROR_MESSAGE_PREFIX}: Route ${
        params.inputToken.symbol
      } (${params.inputToken.chainId}) -> ${params.outputToken.symbol} (${
        params.outputToken.chainId
      }) is not supported`,
    });
  }
}
