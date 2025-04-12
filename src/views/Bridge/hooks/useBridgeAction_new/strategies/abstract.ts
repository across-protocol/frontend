import { utils } from "ethers";

import { useConnectionEVM } from "hooks/useConnectionEVM";
import {
  ApproveTokensParams,
  BridgeActionStrategy,
  DepositActionParams,
} from "./types";
import {
  ChainId,
  fixedPointAdjustment,
  generateHyperLiquidPayload,
  getToken,
  hyperLiquidBridge2Address,
} from "utils";

export abstract class AbstractBridgeActionStrategy
  implements BridgeActionStrategy
{
  constructor(readonly evmConnection: ReturnType<typeof useConnectionEVM>) {}

  abstract isConnected(): boolean;
  abstract isWrongNetwork(requiredChainId: number): boolean;
  abstract switchNetwork(requiredChainId: number): Promise<void>;
  abstract approveTokens(params: ApproveTokensParams): Promise<void>;
  abstract sendDepositTx(params: DepositActionParams): Promise<string>;

  async assertCorrectNetwork(requiredChainId: number) {
    const currentChainId = this.evmConnection.chainId;
    if (currentChainId !== requiredChainId) {
      await this.evmConnection.setChain(requiredChainId);
    }
  }

  async signHyperliquidMessage(params: DepositActionParams) {
    const { depositArgs, transferQuote, selectedRoute } = params;

    if (!this.evmConnection.signer) {
      throw new Error("'signer' is required");
    }

    if (selectedRoute.externalProjectId !== "hyperliquid") {
      throw new Error(
        "'selectedRoute.externalProjectId' must be 'hyperliquid'"
      );
    }

    if (!transferQuote || !transferQuote.quotedFees) {
      throw new Error(
        "'transferQuote' and 'transferQuote.quotedFees' are required"
      );
    }

    // We bridge to Hyperliquid via bridge contract on Arbitrum and need a signature from the user
    // on Arbitrum.
    if (this.evmConnection.signer) {
      await this.assertCorrectNetwork(ChainId.ARBITRUM);
    }

    // Subtract the relayer fee pct just like we do for our output token amount
    const amount = depositArgs.amount.sub(
      depositArgs.amount
        .mul(depositArgs.relayerFeePct)
        .div(fixedPointAdjustment)
    );

    // Build the payload
    const hyperLiquidPayload = await generateHyperLiquidPayload(
      this.evmConnection.signer,
      depositArgs.toAddress,
      amount
    );

    // Create a txn calldata for transfering amount to recipient
    const erc20Interface = new utils.Interface([
      "function transfer(address to, uint256 amount) returns (bool)",
    ]);

    const transferCalldata = erc20Interface.encodeFunctionData("transfer", [
      depositArgs.toAddress,
      amount,
    ]);

    // Encode Instructions struct directly
    const message = utils.defaultAbiCoder.encode(
      [
        "tuple(tuple(address target, bytes callData, uint256 value)[] calls, address fallbackRecipient)",
      ],
      [
        {
          calls: [
            {
              target: getToken("USDC").addresses![ChainId.ARBITRUM],
              callData: transferCalldata,
              value: 0,
            },
            {
              target: hyperLiquidBridge2Address,
              callData: hyperLiquidPayload,
              value: 0,
            },
          ],
          fallbackRecipient: depositArgs.toAddress,
        },
      ]
    );

    return message;
  }
}
