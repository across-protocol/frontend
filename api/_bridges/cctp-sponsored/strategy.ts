import { BigNumber, ethers, utils } from "ethers";
import {
  address,
  appendTransactionMessageInstruction,
  compileTransaction,
  getBase64EncodedWireTransaction,
  partiallySignTransaction,
  fetchAddressesForLookupTables,
} from "@solana/kit";
import { compressTransactionMessageUsingAddressLookupTables } from "@solana/transaction-messages";
import { getAddMemoInstruction } from "@solana-program/memo";
import * as sdk from "@across-protocol/sdk";
import { getDepositForBurnInstructionAsync } from "@across-protocol/contracts/dist/src/svm/clients/SponsoredCctpSrcPeriphery";

import {
  BridgeStrategy,
  GetExactInputBridgeQuoteParams,
  BridgeCapabilities,
  GetOutputBridgeQuoteParams,
} from "../types";
import { CrossSwap, CrossSwapQuotes, Token } from "../../_dexes/types";
import { AppFee, CROSS_SWAP_TYPE } from "../../_dexes/utils";
import { AmountTooLowError, InvalidParamError } from "../../_errors";
import { ConvertDecimals } from "../../_utils";
import { getFallbackRecipient } from "../../_dexes/utils";
import { getEstimatedFillTime } from "../cctp/utils/fill-times";
import { getZeroBridgeFees } from "../utils";
import { getCctpFees } from "../cctp/utils/fees";
import { buildSponsoredCCTPQuote } from "./utils/quote-builder";
import {
  SPONSORED_CCTP_DESTINATION_CHAINS,
  SPONSORED_CCTP_INPUT_TOKENS,
  SPONSORED_CCTP_ORIGIN_CHAINS,
  SPONSORED_CCTP_OUTPUT_TOKENS,
  CCTP_TRANSFER_MODE,
  getSponsoredCctpSrcPeripheryAddress,
} from "./utils/constants";
import {
  getNormalizedSpotTokenSymbol,
  isToHyperCore,
  simulateMarketOrder,
  SPOT_TOKEN_DECIMALS,
  assertAccountExistsOnHyperCore,
} from "../../_hypercore";
import { SPONSORED_CCTP_SRC_PERIPHERY_ABI } from "./utils/abi";
import {
  SWAP_CALLDATA_MARKER,
  tagIntegratorId,
  tagSwapApiMarker,
} from "../../_integrator-id";
import { getSlippage } from "../../_slippage";
import { getCctpBridgeStrategy } from "../cctp/strategy";
import {
  getDepositAccounts,
  SPONSORED_CCTP_MIN_DEPOSIT_USDC_SVM,
  SPONSORED_CCTP_SRC_PERIPHERY_ALT_ADDRESS,
} from "./utils/svm";
import { getSVMRpc } from "../../_providers";
import { assertSponsoredAmountCanBeCovered } from "../../_sponsorship-eligibility";
import { TOKEN_SYMBOLS_MAP } from "../../_constants";

const name = "sponsored-cctp" as const;

const capabilities: BridgeCapabilities = {
  ecosystems: ["evm", "svm"],
  supports: {
    A2A: false,
    A2B: false,
    B2A: false,
    B2B: true,
    B2BI: false,
    crossChainMessage: false,
  },
};

/**
 * Sponsored CCTP bridge strategy
 */
export function getSponsoredCctpBridgeStrategy(
  isEligibleForSponsorship: boolean
): BridgeStrategy {
  return {
    name,
    capabilities,
    originTxNeedsAllowance: true,
    isRouteSupported,

    getCrossSwapTypes: ({ inputToken, outputToken }) => {
      if (isRouteSupported({ inputToken, outputToken })) {
        return [CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE];
      }
      return [];
    },

    getBridgeQuoteRecipient: (crossSwap: CrossSwap) => {
      return crossSwap.recipient;
    },
    getBridgeQuoteMessage: (_crossSwap: CrossSwap, _appFee?: AppFee) => {
      return "0x";
    },
    getQuoteForExactInput: (params: GetExactInputBridgeQuoteParams) =>
      getQuoteForExactInput({ ...params, isEligibleForSponsorship }),
    getQuoteForOutput: (params: GetOutputBridgeQuoteParams) =>
      getQuoteForOutput({ ...params, isEligibleForSponsorship }),
    buildTxForAllowanceHolder: (params: {
      quotes: CrossSwapQuotes;
      integratorId?: string;
    }) =>
      params.quotes.crossSwap.isOriginSvm
        ? buildSvmTxForAllowanceHolder({
            ...params,
            isEligibleForSponsorship,
          })
        : buildEvmTxForAllowanceHolder({
            ...params,
            isEligibleForSponsorship,
          }),
  };
}

export function isRouteSupported(params: {
  inputToken: Token;
  outputToken: Token;
}) {
  return (
    SPONSORED_CCTP_ORIGIN_CHAINS.includes(params.inputToken.chainId) &&
    SPONSORED_CCTP_DESTINATION_CHAINS.includes(params.outputToken.chainId) &&
    SPONSORED_CCTP_INPUT_TOKENS.some(
      (tokenSymbol) =>
        tokenSymbol.toLowerCase() === params.inputToken.symbol.toLowerCase()
    ) &&
    SPONSORED_CCTP_OUTPUT_TOKENS.some(
      (tokenSymbol) =>
        tokenSymbol.toLowerCase() === params.outputToken.symbol.toLowerCase()
    )
  );
}

export async function getQuoteForExactInput(
  params: GetExactInputBridgeQuoteParams & { isEligibleForSponsorship: boolean }
) {
  const { inputToken, outputToken, exactInputAmount } = params;

  assertSupportedRoute({ inputToken, outputToken });

  let outputAmount: BigNumber;
  let provider: "sponsored-cctp" | "cctp" = "sponsored-cctp";
  let fees: {
    amount: BigNumber;
    token: Token;
    pct: BigNumber;
  } = getZeroBridgeFees(inputToken);

  // If recipient does not exist on HyperCore, then we error.
  // This is temporary until we can support account creation for sponsored mint/burn routes.
  if (isToHyperCore(params.outputToken.chainId)) {
    await assertAccountExistsOnHyperCore({
      account: params.recipient,
      chainId: params.outputToken.chainId,
      paramName: "recipient",
    });
  }

  if (params.isEligibleForSponsorship) {
    // We guarantee input amount == output amount for sponsored flows
    outputAmount = ConvertDecimals(
      inputToken.decimals,
      outputToken.decimals
    )(exactInputAmount);
  } else {
    const isSwapPair =
      inputToken.symbol !== getNormalizedSpotTokenSymbol(outputToken.symbol);
    const {
      bridgeQuote: {
        outputAmount: unsponsoredOutputAmount,
        fees: unsponsoredFees,
      },
    } = await getCctpBridgeStrategy({
      // For unsponsored flows routed via our sponsorship periphery contract, we
      // don't need to account for the forward fee.
      useForwardFee: false,
    }).getQuoteForExactInput({
      ...params,
      outputToken: isSwapPair
        ? {
            ...TOKEN_SYMBOLS_MAP["USDC-SPOT"],
            address:
              TOKEN_SYMBOLS_MAP["USDC-SPOT"].addresses[
                params.outputToken.chainId
              ],
            chainId: params.outputToken.chainId,
          }
        : params.outputToken,
    });

    // For USDC to USDT-SPOT unsponsored flows, simulate the HyperLiquid market order
    // to get the actual output amount with swap impact.
    const isUsdcToUsdtSwap =
      isSwapPair && ["USDT", "USDT-SPOT"].includes(outputToken.symbol);

    if (isUsdcToUsdtSwap) {
      const simResult = await simulateMarketOrder({
        chainId: outputToken.chainId,
        tokenIn: {
          symbol: "USDC",
          decimals: SPOT_TOKEN_DECIMALS,
        },
        tokenOut: {
          symbol: "USDT",
          decimals: SPOT_TOKEN_DECIMALS,
        },
        inputAmount: unsponsoredOutputAmount,
      });

      outputAmount = ConvertDecimals(
        SPOT_TOKEN_DECIMALS,
        outputToken.decimals
      )(simResult.outputAmount);
    } else {
      outputAmount = unsponsoredOutputAmount;
    }

    provider = "cctp";
    fees = unsponsoredFees;
  }

  return {
    bridgeQuote: {
      inputToken,
      outputToken,
      inputAmount: exactInputAmount,
      outputAmount,
      minOutputAmount: outputAmount,
      estimatedFillTimeSec: getEstimatedFillTime(
        inputToken.chainId,
        CCTP_TRANSFER_MODE
      ),
      provider,
      fees,
    },
  };
}

export async function getQuoteForOutput(
  params: GetOutputBridgeQuoteParams & { isEligibleForSponsorship: boolean }
) {
  const { inputToken, outputToken, minOutputAmount } = params;

  assertSupportedRoute({ inputToken, outputToken });

  let inputAmount: BigNumber;
  let outputAmount: BigNumber = minOutputAmount;
  let provider: "sponsored-cctp" | "cctp" = "sponsored-cctp";
  let fees: {
    amount: BigNumber;
    token: Token;
    pct: BigNumber;
  } = getZeroBridgeFees(inputToken);

  // If recipient does not exist on HyperCore, then we error.
  // This is temporary until we can support account creation for sponsored mint/burn routes.
  if (isToHyperCore(params.outputToken.chainId)) {
    await assertAccountExistsOnHyperCore({
      account: params.recipient,
      chainId: params.outputToken.chainId,
    });
  }

  // We guarantee input amount == output amount for sponsored flows
  if (params.isEligibleForSponsorship) {
    inputAmount = ConvertDecimals(
      outputToken.decimals,
      inputToken.decimals
    )(minOutputAmount);
  } else {
    const isSwapPair =
      inputToken.symbol !== getNormalizedSpotTokenSymbol(outputToken.symbol);

    const isUsdcToUsdtSwap =
      isSwapPair && ["USDT", "USDT-SPOT"].includes(outputToken.symbol);

    let bridgeOutputRequired = minOutputAmount;
    if (isUsdcToUsdtSwap) {
      // For USDC to USDT-SPOT unsponsored flows, simulate the swap to determine
      // how much USDC-SPOT we need to get the desired output
      const simResult = await simulateMarketOrder({
        chainId: outputToken.chainId,
        tokenIn: {
          symbol: "USDC",
          decimals: SPOT_TOKEN_DECIMALS,
        },
        tokenOut: {
          symbol: "USDT",
          decimals: SPOT_TOKEN_DECIMALS,
        },
        inputAmount: ConvertDecimals(
          outputToken.decimals,
          SPOT_TOKEN_DECIMALS
        )(minOutputAmount),
      });

      // Use the simulation result to estimate the actual output with swap impact
      outputAmount = ConvertDecimals(
        SPOT_TOKEN_DECIMALS,
        outputToken.decimals
      )(simResult.outputAmount);
      bridgeOutputRequired = ConvertDecimals(
        SPOT_TOKEN_DECIMALS,
        outputToken.decimals
      )(simResult.inputAmount);
    }

    const {
      bridgeQuote: {
        inputAmount: unsponsoredInputAmount,
        fees: unsponsoredFees,
      },
    } = await getCctpBridgeStrategy({
      // For unsponsored flows routed via our sponsorship periphery contract, we
      // don't need to account for the forward fee.
      useForwardFee: false,
    }).getQuoteForOutput({
      ...params,
      minOutputAmount: isUsdcToUsdtSwap
        ? bridgeOutputRequired
        : minOutputAmount,
      outputToken: isSwapPair
        ? {
            ...TOKEN_SYMBOLS_MAP["USDC-SPOT"],
            address:
              TOKEN_SYMBOLS_MAP["USDC-SPOT"].addresses[
                params.outputToken.chainId
              ],
            chainId: params.outputToken.chainId,
          }
        : params.outputToken,
    });
    inputAmount = unsponsoredInputAmount;
    provider = "cctp";
    fees = unsponsoredFees;
  }

  return {
    bridgeQuote: {
      inputToken,
      outputToken,
      inputAmount,
      outputAmount,
      minOutputAmount: outputAmount,
      estimatedFillTimeSec: getEstimatedFillTime(
        inputToken.chainId,
        CCTP_TRANSFER_MODE
      ),
      provider,
      fees,
    },
  };
}

export async function buildEvmTxForAllowanceHolder(params: {
  quotes: CrossSwapQuotes;
  integratorId?: string;
  isEligibleForSponsorship: boolean;
}) {
  const { crossSwap } = params.quotes;

  const { quote, signature, sponsoredCctpSrcPeripheryAddress } =
    await _prepareSponsoredTx(params);

  const iface = new ethers.utils.Interface(SPONSORED_CCTP_SRC_PERIPHERY_ABI);
  const callData = iface.encodeFunctionData("depositForBurn", [
    quote,
    signature,
  ]);

  const callDataWithIntegratorId = params.integratorId
    ? tagIntegratorId(params.integratorId, callData)
    : callData;
  const callDataWithMarkers = tagSwapApiMarker(callDataWithIntegratorId);

  return {
    chainId: crossSwap.inputToken.chainId,
    from: crossSwap.depositor,
    to: sponsoredCctpSrcPeripheryAddress,
    data: callDataWithMarkers,
    value: BigNumber.from(0),
    ecosystem: "evm" as const,
  };
}

export async function buildSvmTxForAllowanceHolder(params: {
  quotes: CrossSwapQuotes;
  integratorId?: string;
  isEligibleForSponsorship: boolean;
}) {
  const { crossSwap } = params.quotes;
  const originChainId = crossSwap.inputToken.chainId;
  const rpcClient = getSVMRpc(originChainId);

  const { quote, signature, sponsoredCctpSrcPeripheryAddress } =
    await _prepareSponsoredTx(params);

  // Retrieve accounts required for `depositForBurn` instruction
  // and encode the instruction.
  const depositAccounts = await getDepositAccounts({
    originChainId,
    depositor: crossSwap.depositor,
    destinationDomain: quote.destinationDomain,
    sponsoredCctpSrcPeripheryAddress,
    nonce: quote.nonce,
    inputToken: crossSwap.inputToken.address,
  });
  const svmEncodedQuote = {
    sourceDomain: quote.sourceDomain,
    destinationDomain: quote.destinationDomain,
    mintRecipient: address(
      sdk.utils.toAddressType(quote.mintRecipient, originChainId).toBase58()
    ),
    amount: BigInt(quote.amount.toString()),
    burnToken: address(
      sdk.utils.toAddressType(quote.burnToken, originChainId).toBase58()
    ),
    destinationCaller: address(
      sdk.utils.toAddressType(quote.destinationCaller, originChainId).toBase58()
    ),
    maxFee: BigInt(quote.maxFee.toString()),
    minFinalityThreshold: quote.minFinalityThreshold,
    nonce: ethers.utils.arrayify(quote.nonce),
    deadline: BigInt(quote.deadline.toString()),
    maxBpsToSponsor: BigInt(quote.maxBpsToSponsor.toString()),
    maxUserSlippageBps: BigInt(quote.maxUserSlippageBps.toString()),
    finalRecipient: address(
      sdk.utils.toAddressType(quote.finalRecipient, originChainId).toBase58()
    ),
    finalToken: address(
      sdk.utils.toAddressType(quote.finalToken, originChainId).toBase58()
    ),
    executionMode: quote.executionMode,
    actionData: ethers.utils.arrayify(quote.actionData),
  };
  const depositForBurnIx = await getDepositForBurnInstructionAsync({
    ...depositAccounts,
    quote: svmEncodedQuote,
    signature: ethers.utils.arrayify(signature),
  });

  // Add deposit ix and integrator memo to the transaction
  let tx = await sdk.arch.svm.createDefaultTransaction(
    rpcClient,
    depositAccounts.signer
  );
  tx = appendTransactionMessageInstruction(depositForBurnIx, tx);
  tx = appendTransactionMessageInstruction(
    getAddMemoInstruction({
      memo: params.integratorId
        ? utils.hexConcat([params.integratorId, SWAP_CALLDATA_MARKER])
        : SWAP_CALLDATA_MARKER,
    }),
    tx
  );

  // Fetch ALT addresses to compress the transaction
  const addressesByLookup = await fetchAddressesForLookupTables(
    [address(SPONSORED_CCTP_SRC_PERIPHERY_ALT_ADDRESS)],
    rpcClient
  );
  const compressedTx = compressTransactionMessageUsingAddressLookupTables(
    tx,
    addressesByLookup
  );

  const compiledTx = compileTransaction(compressedTx);
  const partiallySignedTx = await partiallySignTransaction(
    [depositAccounts.messageSentEventData.keyPair],
    compiledTx
  );
  const base64EncodedTx = getBase64EncodedWireTransaction(partiallySignedTx);

  return {
    chainId: originChainId,
    to: sponsoredCctpSrcPeripheryAddress,
    data: base64EncodedTx,
    ecosystem: "svm" as const,
  };
}

async function _prepareSponsoredTx(params: {
  quotes: CrossSwapQuotes;
  integratorId?: string;
  isEligibleForSponsorship: boolean;
}) {
  const {
    bridgeQuote,
    crossSwap,
    originSwapQuote,
    destinationSwapQuote,
    appFee,
  } = params.quotes;

  assertSupportedRoute({
    inputToken: crossSwap.inputToken,
    outputToken: crossSwap.outputToken,
  });

  const originChainId = crossSwap.inputToken.chainId;
  const sponsoredCctpSrcPeripheryAddress =
    getSponsoredCctpSrcPeripheryAddress(originChainId);

  if (!sponsoredCctpSrcPeripheryAddress) {
    throw new InvalidParamError({
      message: `Sponsored CCTP: 'SponsoredCCTPSrcPeriphery' address not found for chain ${originChainId}`,
    });
  }

  if (appFee?.feeAmount.gt(0)) {
    throw new InvalidParamError({
      message: `Sponsored CCTP: App fee is not supported`,
    });
  }

  if (originSwapQuote || destinationSwapQuote) {
    throw new InvalidParamError({
      message: `Sponsored CCTP: Origin/destination swaps are not supported`,
    });
  }

  if (
    sdk.utils.chainIsSvm(originChainId) &&
    bridgeQuote.inputAmount.lt(SPONSORED_CCTP_MIN_DEPOSIT_USDC_SVM)
  ) {
    throw new AmountTooLowError({
      message: `Sponsored CCTP: Solana origin requires a min. deposit of ${utils.formatUnits(
        SPONSORED_CCTP_MIN_DEPOSIT_USDC_SVM,
        6
      )} USDC`,
    });
  }

  // Calculate `maxFee` as required by `depositForBurnWithHook`
  let maxFee = BigNumber.from(0);

  // If eligible for sponsorship, we need to calculate the max fee based on the CCTP fees.
  if (params.isEligibleForSponsorship) {
    const { transferFeeBps, forwardFee } = await getCctpFees({
      inputToken: crossSwap.inputToken,
      outputToken: crossSwap.outputToken,
      transferMode: CCTP_TRANSFER_MODE,
      useSandbox: sdk.utils.chainIsProd(originChainId),
      useForwardFee: true,
    });
    const transferFee = bridgeQuote.inputAmount.mul(transferFeeBps).div(10_000);
    maxFee = transferFee.add(forwardFee);
  }
  // If not eligible for sponsorship, we use the pre-calculated max fee from the bridge quote.
  else {
    maxFee = bridgeQuote.fees.amount;
  }

  // Calculate `maxBpsToSponsor` based on `maxFee` and est. swap slippage
  const { maxBpsToSponsor, swapSlippageBps } = params.isEligibleForSponsorship
    ? // If eligible for sponsorship, we need to calculate the max fee based on the CCTP fees.
      await calculateMaxBpsToSponsor({
        inputToken: crossSwap.inputToken,
        outputToken: crossSwap.outputToken,
        maxFee,
        inputAmount: bridgeQuote.inputAmount,
      })
    : // If not eligible for sponsorship, we use 0 bps as maxBpsToSponsor. This will
      // trigger the un-sponsored flow in the destination periphery contract.
      {
        maxBpsToSponsor: 0,
        swapSlippageBps: 0,
      };

  // If maxBpsToSponsor is greater than 0, we need additional checks to ensure the
  // sponsored amount can get covered.
  if (maxBpsToSponsor > 0) {
    await assertSponsoredAmountCanBeCovered({
      inputToken: crossSwap.inputToken,
      outputToken: crossSwap.outputToken,
      maxBpsToSponsor,
      swapSlippageBps,
      inputAmount: bridgeQuote.inputAmount,
    });
  }

  // Convert slippage tolerance (expressed as 0 < slippage < 100, e.g. 1 = 1%) set by user to bps
  const maxUserSlippageBps = Math.floor(
    getSlippage({
      tokenIn: {
        ...crossSwap.inputToken,
        chainId: crossSwap.outputToken.chainId,
      },
      tokenOut: crossSwap.outputToken,
      slippageTolerance: crossSwap.slippageTolerance,
      originOrDestination: "destination",
    }) * 100
  );

  const { quote, signature } = buildSponsoredCCTPQuote({
    inputToken: crossSwap.inputToken,
    outputToken: crossSwap.outputToken,
    inputAmount: bridgeQuote.inputAmount,
    recipient: crossSwap.recipient,
    depositor: crossSwap.depositor,
    refundRecipient: getFallbackRecipient(crossSwap, crossSwap.recipient),
    maxBpsToSponsor: BigNumber.from(Math.ceil(maxBpsToSponsor)),
    maxUserSlippageBps,
    maxFee,
  });

  return {
    quote,
    signature,
    sponsoredCctpSrcPeripheryAddress,
  };
}

export async function calculateMaxBpsToSponsor(params: {
  inputToken: Token;
  outputToken: Token;
  maxFee: BigNumber;
  inputAmount: BigNumber;
}) {
  const { inputToken, outputToken, maxFee, inputAmount } = params;

  assertSupportedRoute({ inputToken, outputToken });

  const maxFeeBps = maxFee
    .mul(10_000)
    .mul(utils.parseEther("1"))
    .div(inputAmount);

  let maxBpsToSponsor = maxFeeBps;
  let swapSlippageBps = BigNumber.from(0);

  // Simple transfer flow: no swap needed, therefore `maxBpsToSponsor` is `maxFee` in bps
  if (["USDC", "USDC-SPOT"].includes(outputToken.symbol)) {
    maxBpsToSponsor = maxFeeBps;
  }
  // Swap flow: `maxBpsToSponsor` is `maxFee` + est. swap slippage if slippage is positive
  // or only `maxFee` if slippage is negative.
  else {
    const bridgeOutputAmountInputTokenDecimals = params.inputAmount.sub(
      params.maxFee
    );
    const bridgeOutputAmountOutputTokenDecimals = ConvertDecimals(
      params.inputToken.decimals,
      params.outputToken.decimals
    )(bridgeOutputAmountInputTokenDecimals);

    // Retrieve est. swap slippage by simulating a market order for token pair
    const simResult = await simulateMarketOrder({
      chainId: outputToken.chainId,
      tokenIn: {
        symbol: "USDC",
        decimals: SPOT_TOKEN_DECIMALS,
      },
      tokenOut: {
        symbol: outputToken.symbol,
        decimals: outputToken.decimals,
      },
      amount: bridgeOutputAmountOutputTokenDecimals,
      amountType: "input",
    });
    swapSlippageBps = BigNumber.from(
      Math.ceil(simResult.slippagePercent * 100)
    ).mul(utils.parseEther("1"));

    // Positive slippage indicates loss, so we add it to `maxFeeBps`
    if (simResult.slippagePercent > 0) {
      maxBpsToSponsor = maxFeeBps.add(swapSlippageBps);
    }
    // Negative slippage indicates profit, so we return `maxFeeBps`
    else {
      maxBpsToSponsor = maxFeeBps;
    }
  }

  return {
    maxBpsToSponsor: parseFloat(utils.formatEther(maxBpsToSponsor)),
    swapSlippageBps: parseFloat(utils.formatEther(swapSlippageBps)),
  };
}

function assertSupportedRoute(params: {
  inputToken: Token;
  outputToken: Token;
}) {
  if (!isRouteSupported(params)) {
    throw new InvalidParamError({
      message: `Sponsored CCTP: Route ${
        params.inputToken.symbol
      } (${params.inputToken.chainId}) -> ${
        params.outputToken.symbol
      } (${params.outputToken.chainId}) is not supported`,
    });
  }
}
