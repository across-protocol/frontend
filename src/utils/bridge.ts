import { ethers, BigNumber } from "ethers";
import { utils } from "@across-protocol/sdk-v2";

import {
  ChainId,
  fixedPointAdjustment,
  referrerDelimiterHex,
} from "./constants";
import { tagAddress } from "./format";
import { getProvider } from "./providers";
import { getFastFillTimeByRoute } from "./fill-times";
import { getConfig, getCurrentTime } from "utils";
import getApiEndpoint from "./serverless-api";
import { BridgeLimitInterface } from "./serverless-api/types";
import { DepositNetworkMismatchProperties } from "ampli";
import { SwapQuoteApiResponse } from "./serverless-api/prod/swap-quote";

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
  };
}

export type ConfirmationDepositTimeType = {
  formattedString: string;
  lowEstimate: number;
  highEstimate: number;
};

export const getConfirmationDepositTime = (
  amount: BigNumber,
  limits: BridgeLimitInterface,
  toChain: ChainId,
  fromChain: ChainId,
  inputTokenSymbol: string
): ConfirmationDepositTimeType => {
  const config = getConfig();
  const depositDelay = config.depositDelays()[fromChain] || 0;
  const getTimeEstimateRangeString = (
    lowEstimate: number,
    highEstimate: number
  ): {
    formattedString: string;
    lowEstimate: number;
    highEstimate: number;
  } => {
    return {
      formattedString: `~${lowEstimate + depositDelay}-${
        highEstimate + depositDelay
      } minutes`,
      lowEstimate: lowEstimate + depositDelay,
      highEstimate: highEstimate + depositDelay,
    };
  };

  if (amount.lte(limits.maxDepositInstant)) {
    const fastFillTimeInSeconds = Math.floor(
      getFastFillTimeByRoute(fromChain, toChain, inputTokenSymbol)
    );
    const fastFillTimeInMinutes = Math.floor(fastFillTimeInSeconds / 60);
    const fastFillTimeInHours = Number(fastFillTimeInMinutes / 60)
      .toFixed(1)
      .replace(/\.0$/, "");
    return {
      formattedString:
        fastFillTimeInSeconds < 60
          ? `~${fastFillTimeInSeconds} ${
              fastFillTimeInSeconds === 1 ? "sec" : "secs"
            }`
          : fastFillTimeInMinutes < 60
          ? `~${fastFillTimeInMinutes} ${
              fastFillTimeInMinutes === 1 ? "min" : "mins"
            }`
          : `~${fastFillTimeInHours} ${
              fastFillTimeInHours === "1" ? "hour" : "hours"
            }`,
      lowEstimate: fastFillTimeInSeconds,
      highEstimate: fastFillTimeInSeconds,
    };
  } else if (amount.lte(limits.maxDepositShortDelay)) {
    // This is just a rough estimate of how long 2 bot runs (1-4 minutes allocated for each) + an arbitrum transfer of 3-10 minutes would take.
    if (toChain === ChainId.ARBITRUM) return getTimeEstimateRangeString(5, 15);

    // Optimism transfers take about 10-20 minutes anecdotally.
    if (toChain === ChainId.OPTIMISM) {
      return getTimeEstimateRangeString(12, 25);
    }

    // Polygon transfers take 20-30 minutes anecdotally.
    if (toChain === ChainId.POLYGON) return getTimeEstimateRangeString(20, 35);

    // Typical numbers for an arbitrary L2.
    return getTimeEstimateRangeString(10, 30);
  }

  // If the deposit size is above those, but is allowed by the app, we assume the pool will slow relay it.
  return { formattedString: "~2-4 hours", lowEstimate: 180, highEstimate: 360 };
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
 * Makes a deposit on Across using the `SpokePool` contract's `deposit` function.
 * @param signer A valid signer, must be connected to a provider.
 * @param depositArgs - An object containing the {@link AcrossDepositArgs arguments} to pass to the deposit function of the bridge contract.
 * @returns The transaction response obtained after sending the transaction.
 */
export async function sendDepositTx(
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
  }: AcrossDepositArgs,
  onNetworkMismatch?: NetworkMismatchHandler
): Promise<ethers.providers.TransactionResponse> {
  const { spokePool, spokePoolVerifier, shouldUseSpokePoolVerifier } =
    await _getSpokePoolAndVerifier({ fromChain, isNative });

  const commonArgs = [
    recipient,
    tokenAddress,
    amount,
    destinationChainId,
    relayerFeePct,
    quoteTimestamp,
    message,
    maxCount,
    { value: isNative ? amount : ethers.constants.Zero },
  ] as const;
  const tx =
    shouldUseSpokePoolVerifier && spokePoolVerifier
      ? await spokePoolVerifier.populateTransaction.deposit(
          spokePool.address,
          ...commonArgs
        )
      : await spokePool.populateTransaction.deposit(...commonArgs);

  return _tagRefAndSignTx(
    tx,
    referrer || "",
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
  }: AcrossDepositV3Args,
  onNetworkMismatch?: NetworkMismatchHandler
) {
  const { spokePool, shouldUseSpokePoolVerifier } =
    await _getSpokePoolAndVerifier({ fromChain, isNative });

  // `SpokePoolVerifier` uses the signature of the `SpokePool` contract's `deposit`
  // and therefore can not be used for V3 deposits.
  if (shouldUseSpokePoolVerifier) {
    throw new Error("SpokePoolVerifier can not be used for V3 deposits");
  }

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
  const isSpokePoolDeployed = await utils.isContractDeployedToAddress(
    spokePool.address,
    provider
  );
  if (!isSpokePoolDeployed) {
    throw new Error(`SpokePool not deployed at ${spokePool.address}`);
  }

  const swapAndBridge = config.getSwapAndBridge(fromChain, swapQuote.dex);
  const isSwapAndBridgeDeployed =
    swapAndBridge &&
    (await utils.isContractDeployedToAddress(
      swapAndBridge?.address || "",
      provider
    ));
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
    signer,
    fromChain,
    destinationChainId,
    onNetworkMismatch
  );
}

async function _getSpokePoolAndVerifier({
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
    const isSpokePoolVerifierDeployed = await utils.isContractDeployedToAddress(
      spokePoolVerifier!.address,
      provider
    );
    if (!isSpokePoolVerifierDeployed) {
      throw new Error(
        `SpokePoolVerifier not deployed at ${spokePoolVerifier!.address}`
      );
    }
  }

  const isSpokePoolDeployed = await utils.isContractDeployedToAddress(
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
  signer: ethers.Signer,
  originChainId: ChainId,
  destinationChainId: ChainId,
  onNetworkMismatch?: NetworkMismatchHandler
) {
  // do not tag a referrer if data is not provided as a hex string.
  tx.data =
    referrer && ethers.utils.isAddress(referrer)
      ? tagAddress(tx.data!, referrer, referrerDelimiterHex)
      : tx.data;

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
