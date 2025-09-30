import { BigNumber } from "ethers";

import {
  BridgeStrategy,
  GetExactInputBridgeQuoteParams,
  BridgeCapabilities,
  GetOutputBridgeQuoteParams,
} from "../types";
import { CrossSwap, CrossSwapQuotes } from "../../_dexes/types";
import { ConvertDecimals } from "../../_utils";
import { CROSS_SWAP_TYPE } from "../../_dexes/utils";
import { AppFee } from "../../_dexes/utils";
import { Token } from "../../_dexes/types";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../_constants";
import { InvalidParamError } from "../../_errors";
import { encodeTransferCalldata } from "../../_multicall-handler";
import { tagIntegratorId, tagSwapApiMarker } from "../../_integrator-id";
import { getBalanceOnHyperCore } from "../../_hypercore";

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

  const assertSupportedRoute = (params: {
    inputToken: Token;
    outputToken: Token;
  }) => {
    if (!isRouteSupported(params)) {
      throw new InvalidParamError({
        message: `HyperEVM -> HyperCore: Route ${
          params.inputToken.symbol
        } -> ${params.outputToken.symbol} is not supported`,
      });
    }
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

    getQuoteForExactInput: async ({
      inputToken,
      outputToken,
      exactInputAmount,
    }: GetExactInputBridgeQuoteParams) => {
      assertSupportedRoute({ inputToken, outputToken });

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
          fees: getZeroBridgeFees(inputToken),
        },
      };
    },

    getQuoteForOutput: async ({
      inputToken,
      outputToken,
      minOutputAmount,
    }: GetOutputBridgeQuoteParams) => {
      assertSupportedRoute({ inputToken, outputToken });

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
          fees: getZeroBridgeFees(inputToken),
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

      if (appFee?.feeAmount.gt(0)) {
        throw new InvalidParamError({
          message: "HyperEVM -> HyperCore: App fee is not supported",
        });
      }

      if (crossSwap.depositor !== crossSwap.recipient) {
        throw new InvalidParamError({
          message:
            "HyperEVM -> HyperCore: Depositor and recipient must be the same",
        });
      }

      if (originSwapQuote || destinationSwapQuote) {
        throw new InvalidParamError({
          message:
            "HyperEVM -> HyperCore: Can not build tx for origin swap or destination swap",
        });
      }

      const isToHyperCore =
        crossSwap.outputToken.chainId === CHAIN_IDs.HYPERCORE;

      // TODO: Add support for HyperCore -> HyperEVM route
      if (!isToHyperCore) {
        throw new InvalidParamError({
          message: "HyperCore -> HyperEVM: Route not supported yet",
        });
      }

      const depositorBalance = await getBalanceOnHyperCore({
        account: crossSwap.depositor,
        tokenSystemAddress: crossSwap.outputToken.address,
      });

      if (depositorBalance.eq(0)) {
        throw new InvalidParamError({
          message: "Depositor does not have a balance on HyperCore",
        });
      }

      const data = encodeTransferCalldata(
        crossSwap.outputToken.address, // System address on HyperCore
        bridgeQuote.inputAmount // in HyperEVM decimals
      );
      const txDataWithIntegratorId = params.integratorId
        ? tagIntegratorId(params.integratorId, data)
        : data;
      const txDataWithSwapApiMarker = tagSwapApiMarker(txDataWithIntegratorId);

      return {
        chainId: crossSwap.inputToken.chainId,
        from: crossSwap.depositor,
        to: crossSwap.inputToken.address, // HyperEVM address
        data: txDataWithSwapApiMarker,
        value: BigNumber.from(0),
        ecosystem: "evm",
      };
    },
  };
}

function getZeroBridgeFees(inputToken: Token) {
  const zeroBN = BigNumber.from(0);
  return {
    totalRelay: {
      pct: zeroBN,
      total: zeroBN,
      token: inputToken,
    },
    relayerCapital: {
      pct: zeroBN,
      total: zeroBN,
      token: inputToken,
    },
    relayerGas: {
      pct: zeroBN,
      total: zeroBN,
      token: inputToken,
    },
    lp: {
      pct: zeroBN,
      total: zeroBN,
      token: inputToken,
    },
  };
}
