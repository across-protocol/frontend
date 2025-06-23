import { ethers, BigNumber, utils } from "ethers";
import {
  acrossPlusMulticallHandler,
  ChainId,
  fixedPointAdjustment,
  getToken,
  hyperLiquidBridge2Address,
  referrerDelimiterHex,
} from "./constants";
import { DOMAIN_CALLDATA_DELIMITER, tagAddress, tagHex } from "./format";
import { getProvider } from "./providers";
import { getConfig } from "./config";
import getApiEndpoint from "./serverless-api";
import { BridgeLimitInterface } from "./serverless-api/types";
import { DepositNetworkMismatchProperties } from "ampli";
import { SwapQuoteApiResponse } from "./serverless-api/prod/swap-quote";
import { SpokePool, SpokePoolVerifier } from "./typechain";
import { CHAIN_IDs } from "@across-protocol/constants";
import { ConvertDecimals } from "./convertdecimals";
import { generateHyperLiquidPayload } from "./hyperliquid";
import { isContractDeployedToAddress, toBytes32 } from "./sdk";
import {
  TransactionRequest,
  TransactionResponse,
} from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";

const config = getConfig();

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
  fillDeadline: number;
};

type GetBridgeFeesArgs = {
  amount: ethers.BigNumber;
  inputTokenSymbol: string;
  outputTokenSymbol: string;
  fromChainId: ChainId;
  toChainId: ChainId;
  recipientAddress?: string;
  message?: string;
};

export type GetBridgeFeesResult = BridgeFees & {
  isAmountTooLow: boolean;
};

export async function getBridgeFeesWithExternalProjectId(
  externalProjectId: string,
  args: GetBridgeFeesArgs
) {
  let message = undefined;
  let recipientAddress = args.recipientAddress;

  if (externalProjectId === "hyperliquid") {
    const arbitrumProvider = getProvider(CHAIN_IDs.ARBITRUM);
    const wallet = ethers.Wallet.createRandom();
    const signer = new ethers.Wallet(wallet.privateKey, arbitrumProvider);
    const recipient = await signer.getAddress();

    // Build the payload
    const hyperLiquidPayload = await generateHyperLiquidPayload(
      signer,
      recipient,
      args.amount
    );
    // Create a txn calldata for transfering amount to recipient
    const erc20Interface = new utils.Interface([
      "function transfer(address to, uint256 amount) returns (bool)",
    ]);

    const transferCalldata = erc20Interface.encodeFunctionData("transfer", [
      recipient,
      args.amount,
    ]);

    // Encode Instructions struct directly
    message = utils.defaultAbiCoder.encode(
      [
        "tuple(tuple(address target, bytes callData, uint256 value)[] calls, address fallbackRecipient)",
      ],
      [
        {
          calls: [
            {
              target: getToken("USDC").addresses![CHAIN_IDs.ARBITRUM],
              callData: transferCalldata,
              value: 0,
            },
            {
              target: hyperLiquidBridge2Address,
              callData: hyperLiquidPayload,
              value: 0,
            },
          ],
          fallbackRecipient: recipient,
        },
      ]
    );
    recipientAddress = acrossPlusMulticallHandler[args.toChainId];
  }

  return getBridgeFees({
    ...args,
    recipientAddress,
    message,
  });
}

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
  message,
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
    fillDeadline,
  } = await getApiEndpoint().suggestedFees(
    amount,
    config.getTokenInfoBySymbol(fromChainId, inputTokenSymbol).address,
    config.getTokenInfoBySymbol(toChainId, outputTokenSymbol).address,
    toChainId,
    fromChainId,
    recipientAddress,
    message
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
    fillDeadline,
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
    formattedString: `~${timing} ${inMinutes ? "min" : "sec"}${timing > 1 ? "s" : ""}`,
    lowEstimate: timeToFill,
    highEstimate: timeToFill,
  };
};

export type AcrossDepositV3Args = {
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
  inputTokenAddress: string;
  outputTokenAddress: string;
  fillDeadline: number;
  exclusivityDeadline?: number;
  exclusiveRelayer?: string;
};

type NetworkMismatchHandler = (
  mismatchProperties: DepositNetworkMismatchProperties
) => void;

/**
 * Makes a deposit on Across using the `SpokePoolVerifiers` contract's `deposit` function if possible.
 * @param signer A valid signer, must be connected to a provider.
 * @param depositArgs - An object containing the {@link AcrossDepositV3Args arguments} to pass to the deposit function of the bridge contract.
 * @returns The transaction response obtained after sending the transaction.
 */
export async function sendSpokePoolVerifierDepositTx(
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
    exclusiveRelayer = ethers.constants.AddressZero,
    exclusivityDeadline = 0,
    integratorId,
  }: AcrossDepositV3Args,
  spokePool: SpokePool,
  spokePoolVerifier: SpokePoolVerifier,
  onNetworkMismatch?: NetworkMismatchHandler
): Promise<ethers.providers.TransactionResponse> {
  if (!isNative) {
    throw new Error(
      "SpokePoolVerifier should only be used for native deposits"
    );
  }
  const inputAmount = amount;
  const outputAmount = inputAmount.sub(
    inputAmount.mul(relayerFeePct).div(fixedPointAdjustment)
  );
  const tx = await spokePoolVerifier.populateTransaction.deposit(
    spokePool.address,
    toBytes32(recipient),
    toBytes32(inputTokenAddress),
    inputAmount,
    outputAmount,
    destinationChainId,
    toBytes32(exclusiveRelayer),
    quoteTimestamp,
    fillDeadline,
    exclusivityDeadline,
    message,
    { value: inputAmount }
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
  const outputAmount = getDepositOutputAmount({
    amount: inputAmount,
    relayerFeePct,
    fromChain,
    inputTokenAddress,
    toChain: destinationChainId,
    outputTokenAddress,
  });

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

  const tx = await spokePool.populateTransaction.depositV3(...depositArgs);

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

  const inputAmount = BigNumber.from(swapQuote.minExpectedInputTokenAmount);
  const outputAmount = getDepositOutputAmount({
    amount: inputAmount,
    relayerFeePct,
    fromChain,
    inputTokenAddress,
    toChain: destinationChainId,
    outputTokenAddress,
  });

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
  toChain,
  isNative,
}: {
  fromChain: ChainId;
  toChain: ChainId;
  isNative: boolean;
}) {
  const config = getConfig();
  const provider = getProvider(fromChain);

  const spokePool = config.getSpokePool(fromChain);
  const spokePoolVerifier = config.getSpokePoolVerifier(fromChain);

  // Chains where the SpokePoolVerifier is should not be used.
  const disabledChainsForSpokePoolVerifier = [CHAIN_IDs.BSC];
  const disableSpokePoolVerifier =
    disabledChainsForSpokePoolVerifier.includes(fromChain) ||
    disabledChainsForSpokePoolVerifier.includes(toChain);

  // If the spoke pool verifier is enabled, use it for native transfers.
  const shouldUseSpokePoolVerifier =
    Boolean(spokePoolVerifier) && isNative && !disableSpokePoolVerifier;

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

  // Use sendUncheckedTransaction to avoid waiting for the transaction to be mined
  return sendTxn(originChainId, signer, tx);
}

function getDepositOutputAmount(
  depositArgs: Pick<
    AcrossDepositV3Args,
    | "amount"
    | "relayerFeePct"
    | "fromChain"
    | "inputTokenAddress"
    | "toChain"
    | "outputTokenAddress"
  >
) {
  const inputToken = config.getTokenInfoByAddress(
    depositArgs.fromChain,
    depositArgs.inputTokenAddress
  );
  const outputToken = config.getTokenInfoByAddress(
    depositArgs.toChain,
    depositArgs.outputTokenAddress
  );
  const inputAmount = depositArgs.amount;
  const relayerFeePct = depositArgs.relayerFeePct;
  const outputAmount = inputAmount.sub(
    inputAmount.mul(relayerFeePct).div(fixedPointAdjustment)
  );
  return ConvertDecimals(
    inputToken.decimals,
    outputToken.decimals
  )(outputAmount);
}

/**
 * Sends a transaction with optimized behavior for different chains.
 *
 * For mainnet, this function uses `sendUncheckedTransaction` to avoid the polling
 * delay that occurs with the standard `sendTransaction` method. This is critical
 * for user experience as mainnet transactions can take 10-13 seconds (or longer)
 * to be included in a block, during which time the UI would be blocked waiting
 * for confirmation.
 *
 * The standard `sendTransaction` method performs the following steps:
 * 1. Sends the transaction via `sendUncheckedTransaction`
 * 2. Polls the network for the transaction receipt
 * 3. Waits for the transaction to be mined and included in a block
 * 4. Returns the transaction response with full details
 *
 * This polling behavior is problematic for mainnet because:
 * - Block times are ~12-15 seconds
 * - Transactions may not be included in the next block
 * - Network congestion can cause longer inclusion times
 * - The UI becomes unresponsive during the polling period
 *
 * By using `sendUncheckedTransaction` directly for mainnet:
 * - The transaction is sent immediately without waiting for confirmation
 * - The UI can remain responsive and show appropriate loading states
 * - Users can continue interacting with the application
 * - Transaction status can be tracked separately via the returned hash
 *
 * For other chains (testnets, L2s, etc.), we use the standard `sendTransaction`
 * method because:
 * - Block times are typically much faster (1-2 seconds)
 * - Network congestion is less of an issue
 * - The polling delay is acceptable for better transaction confirmation
 *
 * @param originChain - The chain ID where the transaction is being sent
 * @param signer - The ethers signer instance
 * @param tx - The populated transaction to send
 * @returns A promise that resolves to the transaction response
 */
export async function sendTxn(
  originChain: number,
  signer: ethers.Signer,
  tx: Deferrable<TransactionRequest>
): Promise<TransactionResponse> {
  if (originChain === CHAIN_IDs.MAINNET) {
    console.log("signer", signer);
    const txnHash = await (signer as any).sendUncheckedTransaction(tx);
    return {
      hash: String(txnHash),
      confirmations: 0,
      from: await signer.getAddress(),
      nonce: 0,
      gasLimit: BigNumber.from(0),
      gasPrice: BigNumber.from(0),
      data: "",
      to: "",
      value: BigNumber.from(0),
      wait: async () => signer.provider!.getTransactionReceipt(txnHash),
      chainId: originChain,
    };
  }

  return signer.sendTransaction(tx);
}
