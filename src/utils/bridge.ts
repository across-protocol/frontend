import { ethers, BigNumber } from "ethers";

import { callViaMulticall3 } from "../../api/_utils";
import {
  ChainId,
  fixedPointAdjustment,
  referrerDelimiterHex,
} from "./constants";
import { DOMAIN_CALLDATA_DELIMITER, tagAddress, tagHex } from "./format";
import { getProvider } from "./providers";
import { getConfig, isContractDeployedToAddress } from "utils";
import getApiEndpoint from "./serverless-api";
import { BridgeLimitInterface } from "./serverless-api/types";
import { DepositNetworkMismatchProperties } from "ampli";
import { SwapQuoteApiResponse } from "./serverless-api/prod/swap-quote";
import { SpokePool, SpokePoolVerifier } from "./typechain";

export type Fee = {
  total: ethers.BigNumber;
  pct: ethers.BigNumber;
};

export type BridgeFees = {
  totalRelayFee: Fee; // relayerGasFee + relayerCapitalFee + lpFee.
  lpFee: Fee;
  relayerGasFee: Fee;
  relayerCapitalFee: Fee;
  quoteTimestamp: ethers.BigNumber;
  quoteTimestampInMs: ethers.BigNumber;
  quoteLatency: ethers.BigNumber;
  quoteBlock: ethers.BigNumber;
  limits: BridgeLimitInterface;
  estimatedFillTimeSec: number;
  exclusiveRelayer: string;
  exclusivityDeadline: number;
};

type GetBridgeFeesArgs = {
  amount: ethers.BigNumber;
  inputTokenSymbol: string;
  outputTokenSymbol: string;
  fromChainId: ChainId;
  toChainId: ChainId;
  recipientAddress?: string;
};

export type GetBridgeFeesResult = BridgeFees & {
  isAmountTooLow: boolean;
};

/**
 *
 * @param amount - amount to bridge
 * @param inputTokenSymbol - symbol of the input token to bridge
 * @param outputTokenSymbol - symbol of the output token to bridge
 * @param fromChain The origin chain of this bridge action
 * @param toChain The destination chain of this bridge action
 * @returns Returns the `relayerFee` and `lpFee` fees for bridging the given amount of tokens, along with an `isAmountTooLow` flag indicating whether the amount is too low to bridge and an `isLiquidityInsufficient` flag indicating whether the liquidity is insufficient.
 */
export async function getBridgeFees({
  amount,
  inputTokenSymbol,
  outputTokenSymbol,
  fromChainId,
  toChainId,
  recipientAddress,
}: GetBridgeFeesArgs): Promise<GetBridgeFeesResult> {
  const timeBeforeRequests = Date.now();
  const {
    totalRelayFee,
    relayerGasFee,
    relayerCapitalFee,
    isAmountTooLow,
    quoteTimestamp,
    quoteBlock,
    lpFee,
    limits,
    estimatedFillTimeSec,
    exclusiveRelayer,
    exclusivityDeadline,
  } = await getApiEndpoint().suggestedFees(
    amount,
    getConfig().getTokenInfoBySymbol(fromChainId, inputTokenSymbol).address,
    getConfig().getTokenInfoBySymbol(toChainId, outputTokenSymbol).address,
    toChainId,
    fromChainId,
    recipientAddress
  );
  const timeAfterRequests = Date.now();

  const quoteLatency = BigNumber.from(timeAfterRequests - timeBeforeRequests);

  return {
    totalRelayFee,
    relayerGasFee,
    relayerCapitalFee,
    lpFee,
    isAmountTooLow,
    quoteTimestamp,
    quoteTimestampInMs: quoteTimestamp.mul(1000),
    quoteBlock,
    quoteLatency,
    limits,
    estimatedFillTimeSec,
    exclusiveRelayer,
    exclusivityDeadline,
  };
}

export type ConfirmationDepositTimeType = {
  formattedString: string;
  lowEstimate: number;
  highEstimate: number;
};

export const getConfirmationDepositTime = (
  fromChain: number,
  estimatedFillTimeSec?: number
): ConfirmationDepositTimeType => {
  const config = getConfig();
  const depositDelay = config.depositDelays()[fromChain] || 0;
  const timeToFill =
    (estimatedFillTimeSec ?? 900) + // 15 minutes if not provided
    depositDelay;

  const inMinutes = timeToFill > 60;
  const timing = Math.floor(inMinutes ? timeToFill / 60 : timeToFill);

  return {
    formattedString: `~${timing} ${inMinutes ? "minute" : "second"}${timing > 1 ? "s" : ""}`,
    lowEstimate: timeToFill,
    highEstimate: timeToFill,
  };
};

export type AcrossDepositArgs = {
  fromChain: ChainId;
  toChain: ChainId;
  toAddress: string;
  amount: ethers.BigNumber;
  tokenAddress: string;
  relayerFeePct: ethers.BigNumber;
  timestamp: ethers.BigNumber;
  message?: string;
  maxCount?: ethers.BigNumber;
  referrer?: string;
  isNative: boolean;
  integratorId: string;
};

export type AcrossDepositV3Args = AcrossDepositArgs & {
  inputTokenAddress: string;
  outputTokenAddress: string;
  fillDeadline?: number;
  exclusivityDeadline?: number;
  exclusiveRelayer?: string;
};

type NetworkMismatchHandler = (
  mismatchProperties: DepositNetworkMismatchProperties
) => void;

/**
 * Makes a deposit on Across using the `SpokePoolVerifiers` contract's `deposit` function if possible.
 * @param signer A valid signer, must be connected to a provider.
 * @param depositArgs - An object containing the {@link AcrossDepositArgs arguments} to pass to the deposit function of the bridge contract.
 * @returns The transaction response obtained after sending the transaction.
 */
export async function sendSpokePoolVerifierDepositTx(
  signer: ethers.Signer,
  {
    fromChain,
    tokenAddress,
    amount,
    maxCount = ethers.constants.MaxUint256,
    toAddress: recipient,
    toChain: destinationChainId,
    relayerFeePct,
    timestamp: quoteTimestamp,
    message = "0x",
    isNative,
    referrer,
    integratorId,
  }: AcrossDepositArgs,
  spokePool: SpokePool,
  spokePoolVerifier: SpokePoolVerifier,
  onNetworkMismatch?: NetworkMismatchHandler
): Promise<ethers.providers.TransactionResponse> {
  const tx = await spokePoolVerifier.populateTransaction.deposit(
    spokePool.address,
    recipient,
    tokenAddress,
    amount,
    destinationChainId,
    relayerFeePct,
    quoteTimestamp,
    message,
    maxCount,
    { value: isNative ? amount : ethers.constants.Zero }
  );

  return _tagRefAndSignTx(
    tx,
    referrer || "",
    integratorId,
    signer,
    fromChain,
    destinationChainId,
    onNetworkMismatch
  );
}

export async function sendDepositV3Tx(
  signer: ethers.Signer,
  {
    fromChain,
    amount,
    toAddress: recipient,
    toChain: destinationChainId,
    relayerFeePct,
    timestamp: quoteTimestamp,
    message = "0x",
    isNative,
    referrer,
    fillDeadline,
    inputTokenAddress,
    outputTokenAddress,
    exclusiveRelayer = ethers.constants.AddressZero,
    exclusivityDeadline = 0,
    integratorId,
  }: AcrossDepositV3Args,
  spokePool: SpokePool,
  onNetworkMismatch?: NetworkMismatchHandler
) {
  const value = isNative ? amount : ethers.constants.Zero;
  const inputAmount = amount;
  const outputAmount = inputAmount.sub(
    inputAmount.mul(relayerFeePct).div(fixedPointAdjustment)
  );
  fillDeadline ??= await getFillDeadline(spokePool);

  const useExclusiveRelayer =
    exclusiveRelayer !== ethers.constants.AddressZero &&
    exclusivityDeadline > 0;

  const depositArgs = [
    await signer.getAddress(),
    recipient,
    inputTokenAddress,
    outputTokenAddress,
    inputAmount,
    outputAmount,
    destinationChainId,
    exclusiveRelayer,
    quoteTimestamp,
    fillDeadline,
    exclusivityDeadline,
    message,
    { value },
  ] as const;

  const tx = useExclusiveRelayer
    ? await spokePool.populateTransaction.depositExclusive(...depositArgs)
    : await spokePool.populateTransaction.depositV3(...depositArgs);

  return _tagRefAndSignTx(
    tx,
    referrer || "",
    integratorId,
    signer,
    fromChain,
    destinationChainId,
    onNetworkMismatch
  );
}

export async function sendSwapAndBridgeTx(
  signer: ethers.Signer,
  {
    fromChain,
    toAddress: recipient,
    toChain: destinationChainId,
    relayerFeePct,
    timestamp: quoteTimestamp,
    message = "0x",
    isNative,
    referrer,
    fillDeadline,
    inputTokenAddress,
    outputTokenAddress,
    swapTokenAddress,
    exclusiveRelayer = ethers.constants.AddressZero,
    exclusivityDeadline = 0,
    swapQuote,
    swapTokenAmount,
    integratorId,
  }: AcrossDepositV3Args & {
    swapTokenAmount: BigNumber;
    swapTokenAddress: string;
    swapQuote: SwapQuoteApiResponse;
  },
  onNetworkMismatch?: NetworkMismatchHandler
) {
  const config = getConfig();
  const provider = getProvider(fromChain);

  if (isNative) {
    throw new Error("Native swaps are not supported");
  }

  const spokePool = config.getSpokePool(fromChain);
  const isSpokePoolDeployed = await isContractDeployedToAddress(
    spokePool.address,
    provider
  );
  if (!isSpokePoolDeployed) {
    throw new Error(`SpokePool not deployed at ${spokePool.address}`);
  }

  const swapAndBridge = config.getSwapAndBridge(fromChain, swapQuote.dex);
  const isSwapAndBridgeDeployed =
    swapAndBridge &&
    (await isContractDeployedToAddress(swapAndBridge?.address || "", provider));
  if (!isSwapAndBridgeDeployed) {
    throw new Error(
      `SwapAndBridge contract not deployed at ${swapAndBridge?.address} for ${swapQuote.dex}`
    );
  }

  if (swapAndBridge.address !== swapQuote.swapAndBridgeAddress) {
    throw new Error(
      `Mismatch between the SwapAndBridge address provided by the API and the one configured in the app`
    );
  }

  const [_swapTokenAddress, _acrossInputTokenAddress] = await Promise.all([
    swapAndBridge.SWAP_TOKEN(),
    swapAndBridge.ACROSS_INPUT_TOKEN(),
  ]);

  if (
    swapTokenAddress.toLowerCase() !== _swapTokenAddress.toLowerCase() ||
    inputTokenAddress.toLowerCase() !== _acrossInputTokenAddress.toLowerCase()
  ) {
    throw new Error(
      `Mismatch between the SwapAndBridge contract's swap token and input token addresses`
    );
  }

  const inputAmount = BigNumber.from(swapQuote.minExpectedInputTokenAmount);
  const outputAmount = inputAmount.sub(
    inputAmount.mul(relayerFeePct).div(fixedPointAdjustment)
  );
  fillDeadline ??= await getFillDeadline(spokePool);

  const tx = await swapAndBridge.populateTransaction.swapAndBridge(
    swapQuote.routerCalldata,
    swapTokenAmount,
    swapQuote.minExpectedInputTokenAmount,
    {
      outputToken: outputTokenAddress,
      outputAmount,
      depositor: await signer.getAddress(),
      recipient,
      destinationChainid: destinationChainId,
      exclusiveRelayer,
      quoteTimestamp,
      fillDeadline,
      exclusivityDeadline,
      message,
    }
  );

  return _tagRefAndSignTx(
    tx,
    referrer || "",
    integratorId,
    signer,
    fromChain,
    destinationChainId,
    onNetworkMismatch
  );
}

export async function getSpokePoolAndVerifier({
  fromChain,
  isNative,
}: {
  fromChain: ChainId;
  isNative: boolean;
}) {
  const config = getConfig();
  const provider = getProvider(fromChain);

  const spokePool = config.getSpokePool(fromChain);
  const spokePoolVerifier = config.getSpokePoolVerifier(fromChain);

  // If the spoke pool verifier is enabled, use it for native transfers.
  const shouldUseSpokePoolVerifier = Boolean(spokePoolVerifier) && isNative;

  if (shouldUseSpokePoolVerifier) {
    const isSpokePoolVerifierDeployed = await isContractDeployedToAddress(
      spokePoolVerifier!.address,
      provider
    );
    if (!isSpokePoolVerifierDeployed) {
      throw new Error(
        `SpokePoolVerifier not deployed at ${spokePoolVerifier!.address}`
      );
    }
  }

  const isSpokePoolDeployed = await isContractDeployedToAddress(
    spokePool.address,
    provider
  );
  if (!isSpokePoolDeployed) {
    throw new Error(`SpokePool not deployed at ${spokePool.address}`);
  }

  return {
    spokePool,
    spokePoolVerifier,
    shouldUseSpokePoolVerifier,
  };
}

async function getFillDeadline(spokePool: SpokePool): Promise<number> {
  const calls = [
    {
      contract: spokePool,
      functionName: "getCurrentTime",
    },
    {
      contract: spokePool,
      functionName: "fillDeadlineBuffer",
    },
  ];
  const [currentTime, fillDeadlineBuffer] = await callViaMulticall3(
    spokePool.provider,
    calls
  );
  return Number(currentTime) + Number(fillDeadlineBuffer);
}

async function _tagRefAndSignTx(
  tx: ethers.PopulatedTransaction,
  referrer: string,
  integratorId: string,
  signer: ethers.Signer,
  originChainId: ChainId,
  destinationChainId: ChainId,
  onNetworkMismatch?: NetworkMismatchHandler
) {
  // do not tag a referrer if data is not provided as a hex string.
  tx.data = tagHex(
    referrer && ethers.utils.isAddress(referrer)
      ? tagAddress(tx.data!, referrer, referrerDelimiterHex)
      : tx.data!,
    integratorId,
    DOMAIN_CALLDATA_DELIMITER
  );

  // Last test to ensure that the tx is valid and that the signer
  // is connected to the correct chain.
  // NOTE: I think this is a good candiate for using an RPC call
  //       to get the chainId of the signer.
  const signerChainId = await signer.getChainId();
  if (signerChainId !== originChainId) {
    onNetworkMismatch?.({
      signerAddress: await signer.getAddress(),
      fromChainId: String(originChainId),
      toChainId: String(destinationChainId),
      signerChainId: String(signerChainId),
    });
    throw new Error(
      "Signer is not connected to the correct chain. This may have happened in the background"
    );
  }

  return signer.sendTransaction(tx);
}
