import { BigNumber } from "ethers";

import {
  BridgeStrategy,
  GetExactInputBridgeQuoteParams,
  BridgeCapabilities,
  GetOutputBridgeQuoteParams,
  OriginTx,
} from "../types";
import { CrossSwap, CrossSwapQuotes } from "../../_dexes/types";
import { ConvertDecimals, getMulticall3, getProvider } from "../../_utils";
import { CROSS_SWAP_TYPE } from "../../_dexes/utils";
import { AppFee } from "../../_dexes/utils";
import { Token } from "../../_dexes/types";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../_constants";
import { InvalidParamError } from "../../_errors";
import {
  CORE_WRITER_EVM_ADDRESS,
  encodeTransferOnCoreCalldata,
} from "../../_hypercore";
import { encodeTransferCalldata } from "../../_multicall-handler";
import { tagIntegratorId, tagSwapApiMarker } from "../../_integrator-id";

const supportedTokens = [TOKEN_SYMBOLS_MAP["USDT-SPOT"]];

const name = "hypercore";
const capabilities: BridgeCapabilities = {
  ecosystems: ["evm"],
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
 * This strategy is only supported for HyperEVM <-> HyperCore transfers of SPOT tokens.
 * @returns
 */
export function getHyperCoreBridgeStrategy(): BridgeStrategy {
  const isRouteSupported = (params: {
    inputToken: Token;
    outputToken: Token;
  }) => {
    // HyperEVM -> HyperCore
    if (
      CHAIN_IDs.HYPEREVM === params.inputToken.chainId &&
      CHAIN_IDs.HYPERCORE === params.outputToken.chainId
    ) {
      const supportedInputToken = supportedTokens.find(
        (token) =>
          token.addresses[CHAIN_IDs.HYPEREVM].toLowerCase() ===
          params.inputToken.address.toLowerCase()
      );
      const supportedOutputToken = supportedTokens.find(
        (token) =>
          token.addresses[CHAIN_IDs.HYPERCORE].toLowerCase() ===
          params.outputToken.address.toLowerCase()
      );
      return Boolean(supportedInputToken && supportedOutputToken);
    }
    // TODO: Add support for HyperCore -> HyperEVM
    return false;
  };

  return {
    name,
    capabilities,

    getCrossSwapTypes: (params: {
      inputToken: Token;
      outputToken: Token;
      isInputNative: boolean;
      isOutputNative: boolean;
    }) => {
      if (
        isRouteSupported({
          inputToken: params.inputToken,
          outputToken: params.outputToken,
        })
      ) {
        return [CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE];
      }
      // TODO: Add support for HyperCore -> HyperEVM
      return [];
    },

    getBridgeQuoteRecipient: (crossSwap: CrossSwap) => {
      return crossSwap.recipient;
    },

    getBridgeQuoteMessage: (_crossSwap: CrossSwap, _appFee?: AppFee) => {
      return "0x";
    },

    getQuoteExactInput: async ({
      inputToken,
      outputToken,
      exactInputAmount,
    }: GetExactInputBridgeQuoteParams) => {
      if (!isRouteSupported({ inputToken, outputToken })) {
        throw new InvalidParamError({
          message: "HyperCore: Can not get bridge quote for unsupported route",
        });
      }
      const outputAmount = ConvertDecimals(
        inputToken.decimals,
        outputToken.decimals
      )(exactInputAmount);

      return {
        bridgeQuote: {
          inputToken,
          outputToken,
          inputAmount: exactInputAmount,
          outputAmount,
          minOutputAmount: outputAmount,
          estimatedFillTimeSec: 0,
          provider: name,
        },
      };
    },

    getQuoteForOutput: async ({
      inputToken,
      outputToken,
      minOutputAmount,
    }: GetOutputBridgeQuoteParams) => {
      if (!isRouteSupported({ inputToken, outputToken })) {
        throw new InvalidParamError({
          message: "HyperCore: Can not get bridge quote for unsupported route",
        });
      }

      const inputAmount = ConvertDecimals(
        outputToken.decimals,
        inputToken.decimals
      )(minOutputAmount);

      return {
        bridgeQuote: {
          inputToken,
          outputToken,
          inputAmount,
          outputAmount: minOutputAmount,
          minOutputAmount,
          estimatedFillTimeSec: 0,
          provider: name,
        },
      };
    },

    buildTxForAllowanceHolder: async (params: {
      quotes: CrossSwapQuotes;
      integratorId?: string | undefined;
    }) => {
      const {
        bridgeQuote,
        crossSwap,
        originSwapQuote,
        destinationSwapQuote,
        appFee,
      } = params.quotes;

      const multicall3 = getMulticall3(
        crossSwap.inputToken.chainId,
        getProvider(crossSwap.inputToken.chainId)
      );

      if (!multicall3) {
        throw new InvalidParamError({
          message: "HyperCore: No Multicall3 deployed on input token chain",
        });
      }

      if (originSwapQuote || destinationSwapQuote) {
        throw new InvalidParamError({
          message:
            "HyperCore: Can not build tx for origin swap or destination swap",
        });
      }

      const isToHyperCore =
        crossSwap.outputToken.chainId === CHAIN_IDs.HYPERCORE;

      // TODO: Add support for HyperCore -> HyperEVM route
      if (!isToHyperCore) {
        throw new InvalidParamError({
          message:
            "HyperCore: Can not build tx for HyperCore -> HyperEVM route",
        });
      }

      const calls = [
        // Transfer HyperEVM tokens from sender to HyperCore
        {
          target: crossSwap.inputToken.address,
          callData: encodeTransferCalldata(
            crossSwap.outputToken.address,
            bridgeQuote.outputAmount
          ),
        },
      ];

      const appFeeAmount = appFee
        ? ConvertDecimals(
            appFee.feeToken.decimals,
            crossSwap.outputToken.decimals
          )(appFee.feeAmount)
        : BigNumber.from(0);

      if (appFeeAmount.gt(0) && crossSwap.appFeeRecipient) {
        // Send app fee to app fee recipient if specified
        calls.push({
          target: CORE_WRITER_EVM_ADDRESS,
          callData: encodeTransferOnCoreCalldata({
            recipientAddress: crossSwap.appFeeRecipient,
            tokenSystemAddress: crossSwap.outputToken.address, // System address on HyperCore
            amount: appFeeAmount,
          }),
        });
      }

      // Send output amount to recipient
      const outputAmount = bridgeQuote.outputAmount.sub(appFeeAmount);
      calls.push({
        target: CORE_WRITER_EVM_ADDRESS,
        callData: encodeTransferOnCoreCalldata({
          recipientAddress: crossSwap.recipient,
          tokenSystemAddress: crossSwap.outputToken.address, // System address on HyperCore
          amount: outputAmount,
        }),
      });

      const tx = await multicall3.populateTransaction.aggregate(
        calls.map((call) => ({
          target: call.target,
          callData: call.callData,
        }))
      );
      const txDataWithIntegratorId = params.integratorId
        ? tagIntegratorId(params.integratorId, tx.data!)
        : tx.data!;
      const txDataWithSwapApiMarker = tagSwapApiMarker(txDataWithIntegratorId);

      return {
        chainId: crossSwap.inputToken.chainId,
        from: crossSwap.depositor,
        to: multicall3.address,
        data: txDataWithSwapApiMarker,
        value: BigNumber.from(0),
        ecosystem: "evm",
      };
    },
  };
}
