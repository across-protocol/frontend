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
import {
  accountExistsOnHyperCore,
  CORE_WRITER_EVM_ADDRESS,
  encodeTransferOnCoreCalldata,
} from "../../_hypercore";

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

    // HyperCore -> HyperEVM
    if (
      CHAIN_IDs.HYPERCORE === params.inputToken.chainId &&
      CHAIN_IDs.HYPEREVM === params.outputToken.chainId
    ) {
      const supportedInputToken = supportedTokens.find(
        (token) =>
          token.addresses[CHAIN_IDs.HYPERCORE].toLowerCase() ===
          params.inputToken.address.toLowerCase()
      );
      const supportedOutputToken = supportedTokens.find(
        (token) =>
          token.addresses[CHAIN_IDs.HYPEREVM].toLowerCase() ===
          params.outputToken.address.toLowerCase()
      );
      return Boolean(supportedInputToken && supportedOutputToken);
    }

    return false;
  };

  const assertSupportedRoute = (params: {
    inputToken: Token;
    outputToken: Token;
  }) => {
    if (!isRouteSupported(params)) {
      throw new InvalidParamError({
        message: `HyperCore: Route ${
          params.inputToken.symbol
        } (${params.inputToken.chainId}) -> ${
          params.outputToken.symbol
        } (${params.outputToken.chainId}) is not supported`,
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

      const isToHyperCore =
        crossSwap.outputToken.chainId === CHAIN_IDs.HYPERCORE;

      const errorMessagePrefix = isToHyperCore
        ? "HyperEVM -> HyperCore"
        : "HyperCore -> HyperEVM";

      if (appFee?.feeAmount.gt(0)) {
        throw new InvalidParamError({
          message: `${errorMessagePrefix}: App fee is not supported`,
        });
      }

      if (crossSwap.depositor !== crossSwap.recipient) {
        throw new InvalidParamError({
          message: `${errorMessagePrefix}: Depositor and recipient must be the same`,
        });
      }

      if (originSwapQuote || destinationSwapQuote) {
        throw new InvalidParamError({
          message: `${errorMessagePrefix}: Can not build tx for origin swap or destination swap`,
        });
      }

      const depositorExists = await accountExistsOnHyperCore({
        account: crossSwap.depositor,
      });

      if (!depositorExists) {
        throw new InvalidParamError({
          message: `${errorMessagePrefix}: Depositor is not initialized on HyperCore`,
        });
      }

      let data: string;
      let target: string;

      // HyperEVM -> HyperCore: Transferring tokens from HyperEVM to HyperCore can be
      // done using an ERC20 transfer with the corresponding system address as the
      // destination. The tokens are credited to the Core based on the emitted
      // `Transfer(address from, address to, uint256 value)a from the linked contract.
      if (isToHyperCore) {
        data = encodeTransferCalldata(
          crossSwap.outputToken.address, // System address on HyperCore
          bridgeQuote.inputAmount // in HyperEVM decimals
        );
        target = crossSwap.inputToken.address; // Token address on HyperEVM
      } else {
        // HyperCore -> HyperEVM: Transferring tokens from HyperCore to HyperEVM can be
        // done using a `spotSend` action with the corresponding system address as the
        // destination. The tokens are credited by a system transaction that calls
        // `transfer(recipient, amount)` on the linked contract as the system address,
        // where recipient is the sender of the spotSend action.
        data = encodeTransferOnCoreCalldata({
          recipientAddress: crossSwap.inputToken.address, // System address on HyperCore
          tokenSystemAddress: crossSwap.inputToken.address, // System address on HyperCore
          amount: bridgeQuote.inputAmount, // in HyperCore decimals
        });
        target = CORE_WRITER_EVM_ADDRESS;

        // TODO: It might make sense to check the balance of native gas token on HyperCore
        // here, as it seems to be required for the action to succeed. We need to figure
        // out how to do this.
      }

      const txDataWithIntegratorId = params.integratorId
        ? tagIntegratorId(params.integratorId, data)
        : data;
      const txDataWithSwapApiMarker = tagSwapApiMarker(txDataWithIntegratorId);

      return {
        chainId: CHAIN_IDs.HYPEREVM,
        from: crossSwap.depositor,
        to: target,
        data: txDataWithSwapApiMarker,
        value: BigNumber.from(0),
        ecosystem: "evm",
      };
    },

    isRouteSupported,
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
