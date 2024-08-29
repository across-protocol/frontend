import { ethers, BigNumber } from "ethers";

import {
  ChainId,
  fixedPointAdjustment,
  referrerDelimiterHex,
} from "./constants";
import { DOMAIN_CALLDATA_DELIMITER, tagAddress, tagHex } from "./format";
import { getProvider } from "./providers";
import { getConfig, getCurrentTime, isContractDeployedToAddress } from "utils";
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
 * Retrieves the bridge fees for a given token bridging operation.
 *
 * @param amount - The amount of tokens to be bridged.
 * @param inputTokenSymbol - The symbol of the input token to be bridged.
 * @param outputTokenSymbol - The symbol of the output token to be received after bridging.
 * @param fromChainId - The ID of the origin chain for the bridge operation.
 * @param toChainId - The ID of the destination chain for the bridge operation.
 * @param recipientAddress - The address of the recipient who will receive the bridged tokens.
 * @returns An object containing the following properties:
 *   - `totalRelayFee`: The total relay fee for the bridge operation.
 *   - `relayerGasFee`: The gas fee paid to the relayer.
 *   - `relayerCapitalFee`: The capital fee paid to the relayer.
 *   - `lpFee`: The fee paid to the liquidity provider.
 *   - `isAmountTooLow`: A boolean indicating whether the provided amount is too low to bridge.
 *   - `quoteTimestamp`: The timestamp of the bridge fee quote.
 *   - `quoteTimestampInMs`: The quote timestamp in milliseconds.
 *   - `quoteBlock`: The block number of the bridge fee quote.
 *   - `quoteLatency`: The latency of the bridge fee quote request in milliseconds.
 *   - `limits`: An object containing the minimum and maximum bridge limits.
 *   - `estimatedFillTimeSec`: The estimated time in seconds for the bridge operation to be filled.
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
 * Makes a deposit on the Across protocol using the `SpokePoolVerifiers` contract's `deposit` function, if possible.
 *
 * @param signer - A valid Ethereum signer, which must be connected to a provider.
 * @param spokePool - The `SpokePool` contract instance used for the deposit operation.
 * @param spokePoolVerifier - The `SpokePoolVerifier` contract instance used for the deposit operation.
 * @param onNetworkMismatch - An optional callback function that will be called if the signer's network does not match the from/to chain IDs.
 * @param depositArgs - An object containing the {@link AcrossDepositArgs arguments} to pass to the deposit function of the bridge contract.
 * @returns The transaction response obtained after sending the deposit transaction.
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
  fillDeadline ??=
    getCurrentTime() - 60 + (await spokePool.fillDeadlineBuffer());

  const tx = await spokePool.populateTransaction.depositV3(
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
    { value }
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
  fillDeadline ??=
    getCurrentTime() - 60 + (await spokePool.fillDeadlineBuffer());

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
