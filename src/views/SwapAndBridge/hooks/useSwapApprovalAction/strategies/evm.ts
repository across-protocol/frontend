import { AbstractSwapApprovalActionStrategy } from "./abstract";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { ApprovalTxn, SwapApprovalData, SwapTx } from "./types";
import { utils } from "ethers";
import {
  acrossPlusMulticallHandler,
  ChainId,
  fixedPointAdjustment,
  generateHyperLiquidPayload,
  getSpokePoolAndVerifier,
  getToken,
  hyperLiquidBridge2Address,
  sendDepositTx,
} from "utils";
import { DepositActionParams } from "views/Bridge/hooks/useBridgeAction/strategies/types";

export class EVMSwapApprovalActionStrategy extends AbstractSwapApprovalActionStrategy {
  constructor(evmConnection: ReturnType<typeof useConnectionEVM>) {
    super(evmConnection);
  }

  private getSigner() {
    const { signer } = this.evmConnection;
    if (!signer) {
      throw new Error("No signer available");
    }
    return signer;
  }

  isConnected(): boolean {
    return this.evmConnection.isConnected;
  }

  isWrongNetwork(requiredChainId: number): boolean {
    const connectedChainId = this.evmConnection.chainId;
    return connectedChainId !== requiredChainId;
  }

  async switchNetwork(requiredChainId: number): Promise<void> {
    await this.evmConnection.setChain(requiredChainId);
  }

  async approve(approvalData: SwapApprovalData): Promise<boolean> {
    const signer = this.getSigner();
    // approvals first
    const approvals: ApprovalTxn[] = approvalData.approvalTxns || [];
    for (const approval of approvals) {
      await this.switchNetwork(approval.chainId);
      await this.assertCorrectNetwork(approval.chainId);
      await signer.sendTransaction({
        to: approval.to,
        data: approval.data,
        chainId: approval.chainId,
      });
    }
    return true;
  }

  async swap(approvalData: SwapApprovalData): Promise<string> {
    const signer = this.getSigner();

    const swapTx: SwapTx = approvalData.swapTx;
    await this.switchNetwork(swapTx.chainId);
    await this.assertCorrectNetwork(swapTx.chainId);
    const tx = await signer.sendTransaction({
      to: swapTx.to,
      data: swapTx.data,
      value: swapTx.value,
      chainId: swapTx.chainId,
      gasPrice: undefined,
      maxFeePerGas: swapTx.maxFeePerGas as any,
      maxPriorityFeePerGas: swapTx.maxPriorityFeePerGas as any,
      gasLimit: swapTx.gas as any,
    });
    return tx.hash;
  }

  async execute(
    swapTxData?: SwapApprovalData,
    bridgeTxData?: DepositActionParams
  ): Promise<string> {
    try {
      if (swapTxData) {
        return await this.executeSwapTx(swapTxData);
      } else if (bridgeTxData) {
        return await this.executeBridgeTx(bridgeTxData);
      }

      throw new Error("No tx data to execute.");
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async executeBridgeTx(bridgeTxData: DepositActionParams): Promise<string> {
    try {
      // Handle deposits to Hyperliquid
      if (bridgeTxData.depositArgs.externalProjectId === "hyperliquid") {
        return await this._sendHyperliquidDepositTx(bridgeTxData);
      }
      throw new Error(
        "Only external project routes supported via direct bridge"
      );
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async executeSwapTx(swapTxData: SwapApprovalData): Promise<string> {
    try {
      await this.approve(swapTxData);
      return await this.swap(swapTxData);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  /**
   * We need to set up our crosschain message to the hyperliquid bridge with the following considerations:
   * 1. Our recipient address is the default multicall handler
   * 2. The recipient and the signer must be the same address
   * 3. We will first transfer funds to the true recipient EoA
   * 4. We must construct a payload to send to HL's Bridge2 contract
   * 5. The user must sign this signature
   */
  private async _sendHyperliquidDepositTx(params: DepositActionParams) {
    const { depositArgs, transferQuote, selectedRoute } = params;

    if (!transferQuote?.quotedFees) {
      throw new Error("'transferQuote.quotedFees' is required");
    }

    // For Hyperliquid, we need to switch to Arbitrum for permit signing
    // then switch back to the source chain for the deposit
    const message = await this._generateHyperliquidMessage(params);

    // Ensure we are on the correct network for the deposit
    await this.assertCorrectNetwork(selectedRoute.fromChain);

    const { spokePool } = await getSpokePoolAndVerifier(selectedRoute);
    const tx = await sendDepositTx(
      this.getSigner(),
      {
        ...depositArgs,
        inputTokenAddress: selectedRoute.fromTokenAddress,
        outputTokenAddress: selectedRoute.toTokenAddress,
        inputTokenSymbol: selectedRoute.fromTokenSymbol,
        outputTokenSymbol: selectedRoute.toTokenSymbol,
        fillDeadline: transferQuote.quotedFees.fillDeadline,
        message,
        toAddress: acrossPlusMulticallHandler[selectedRoute.toChain],
      },
      spokePool,
      params.onNetworkMismatch
    );

    return tx.hash;
  }

  /**
   * Generate Hyperliquid message with permit signature
   * This method handles the network switching for permit signing
   */
  private async _generateHyperliquidMessage(params: DepositActionParams) {
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

    // Store current chain to restore later
    const currentChainId = this.evmConnection.chainId;

    // Switch to Arbitrum for permit signing (required for EIP-712 signature)
    if (currentChainId !== ChainId.ARBITRUM) {
      await this.evmConnection.setChain(ChainId.ARBITRUM);
    }

    try {
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
    } finally {
      await this.evmConnection.setChain(selectedRoute.fromChain);
    }
  }
}
