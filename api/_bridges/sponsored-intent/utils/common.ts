import { BigNumber, ethers } from "ethers";

import { SwapQuote, Token } from "../../../_dexes/types";
import { AmountTooHighError, InvalidParamError } from "../../../_errors";
import { accountExistsOnHyperCore, isToHyperCore } from "../../../_hypercore";
import { AppFee } from "../../../_dexes/utils";
import { CHAIN_IDs } from "../../../_constants";
import {
  BRIDGEABLE_OUTPUT_TOKEN_PER_OUTPUT_TOKEN,
  HYPERLIQUID_DEPOSIT_HANDLER_ADDRESS,
  ERROR_MESSAGE_PREFIX,
  SUPPORTED_OUTPUT_TOKENS,
  SUPPORTED_INPUT_TOKENS,
  SUPPORTED_DESTINATION_CHAINS,
  SUPPORTED_ORIGIN_CHAINS,
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

export function getBridgeableOutputToken(outputToken: Token) {
  return BRIDGEABLE_OUTPUT_TOKEN_PER_OUTPUT_TOKEN[outputToken.symbol];
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
    return HYPERLIQUID_DEPOSIT_HANDLER_ADDRESS;
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
        bridgeableOutputToken.addresses[hyperEvmChainId]
      )
    )
  );
  const maxBalance = maxBN(...relayerBalances);
  const maxAvailableBalance = ConvertDecimals(
    bridgeableOutputToken.decimals,
    params.inputToken.decimals
  )(maxBalance);

  const MAX_USDH_DEPOSIT_LIMIT = ethers.utils.parseUnits(
    "50000",
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

export async function assertAccountExistsOnHyperCore(params: {
  account: string;
  errorMessagePrefix: string;
}) {
  const { account, errorMessagePrefix } = params;

  const depositorExists = await accountExistsOnHyperCore({
    account,
  });

  if (!depositorExists) {
    throw new InvalidParamError({
      message: `${errorMessagePrefix}: Account ${account} is not initialized on HyperCore`,
    });
  }
}

export function assertNoSwaps(params: {
  originSwapQuote?: SwapQuote;
  destinationSwapQuote?: SwapQuote;
  errorMessagePrefix: string;
}) {
  const { originSwapQuote, destinationSwapQuote, errorMessagePrefix } = params;

  if (originSwapQuote || destinationSwapQuote) {
    throw new InvalidParamError({
      message: `${errorMessagePrefix}: Can not build tx for origin swap or destination swap`,
    });
  }
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
    const supportedInputToken = SUPPORTED_INPUT_TOKENS.find(
      (token) =>
        token.addresses[params.inputToken.chainId]?.toLowerCase() ===
        params.inputToken.address.toLowerCase()
    );
    const supportedOutputToken = SUPPORTED_OUTPUT_TOKENS.find(
      (token) =>
        token.addresses[params.outputToken.chainId]?.toLowerCase() ===
        params.outputToken.address.toLowerCase()
    );
    return Boolean(supportedInputToken && supportedOutputToken);
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
