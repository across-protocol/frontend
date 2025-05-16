import { BigNumber, constants, providers } from "ethers";

import {
  ChainId,
  getConfig,
  MAX_APPROVAL_AMOUNT,
  waitOnTransaction,
  getSpokePoolAndVerifier,
  sendSpokePoolVerifierDepositTx,
  sendDepositV3Tx,
  sendSwapAndBridgeTx,
  acrossPlusMulticallHandler,
} from "utils";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { ERC20__factory } from "utils/typechain";
import { AbstractBridgeActionStrategy } from "./abstract";

import { ApproveTokensParams, DepositActionParams } from "./types";

const config = getConfig();

export class EVMBridgeActionStrategy extends AbstractBridgeActionStrategy {
  constructor(evmConnection: ReturnType<typeof useConnectionEVM>) {
    super(evmConnection);
  }

  get signer() {
    const { signer } = this.evmConnection;
    if (!signer) {
      throw new Error("No signer available");
    }
    return signer;
  }

  get account() {
    const { account } = this.evmConnection;
    if (!account) {
      throw new Error("No account available");
    }
    return account;
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

  async approveTokens(params: ApproveTokensParams): Promise<void> {
    const { depositArgs, transferQuote, selectedRoute } = params;
    const signer = this.signer;
    const account = this.account;

    if (!transferQuote) {
      throw new Error("'transferQuote' is required");
    }

    const { quotedUniversalSwap, quotedSwap } = transferQuote;

    const isUniversalSwapRoute = selectedRoute.type === "universal-swap";
    const isSwapRoute = selectedRoute.type === "swap";
    const requiredChainId = selectedRoute.fromChain;

    await this.assertCorrectNetwork(requiredChainId);

    // If universal swap route then we need to approve the universal swap token
    // for the `UniversalSwapAndBridge` contract
    if (isUniversalSwapRoute && quotedUniversalSwap?.approvalTxns?.length) {
      // Some ERC-20 tokens require multiple approvals
      for (const approvalTxn of quotedUniversalSwap.approvalTxns) {
        const approvalTx = await signer.sendTransaction(approvalTxn);
        await approvalTx.wait();
      }
    }
    // If swap route then we need to approve the swap token for the `SwapAndBridge`
    // contract instead of the `SpokePool` contract.
    else if (isSwapRoute && selectedRoute.swapTokenSymbol !== "ETH") {
      if (!quotedSwap?.dex) {
        throw new Error("'quotedSwap.dex' is required");
      }

      const swapAndBridgeAddress = config.getSwapAndBridgeAddress(
        requiredChainId,
        quotedSwap.dex
      );
      if (!swapAndBridgeAddress) {
        throw new Error("'swapAndBridgeAddress' is required");
      }

      await this._approveTokens({
        chainId: requiredChainId,
        tokenSymbol: selectedRoute.swapTokenSymbol,
        amount: depositArgs.initialAmount,
        spender: swapAndBridgeAddress,
        owner: account,
      });
    }
    // If normal bridge route then we need to approve the token for the `SpokePool`
    // contract.
    else if (selectedRoute.fromTokenSymbol !== "ETH") {
      await this._approveTokens({
        chainId: requiredChainId,
        tokenSymbol: selectedRoute.fromTokenSymbol,
        amount: depositArgs.amount,
        spender: config.getSpokePoolAddress(requiredChainId),
        owner: account,
      });
    }
  }

  async sendDepositTx(params: DepositActionParams): Promise<string> {
    const { selectedRoute } = params;

    const isUniversalSwapRoute = selectedRoute.type === "universal-swap";
    const isSwapRoute = selectedRoute.type === "swap";

    // Handle deposits to Hyperliquid
    if (selectedRoute.externalProjectId === "hyperliquid") {
      return this._sendHyperliquidDepositTx(params);
    }

    // Handle universal swap routes. Currently only used for GHO/WGHO related swaps for Lens.
    if (isUniversalSwapRoute) {
      return this._sendUniversalSwapAndBridgeTx(params);
    }

    // NOTE: LEGACY swap route handling - currently only used for USDC.e->USDC swaps
    // TODO: refactor into universal swap handling
    if (isSwapRoute) {
      return this._sendSwapAndBridgeTx(params);
    }

    // Default deposits
    return this._sendDepositTx(params);
  }

  private async _sendDepositTx(params: DepositActionParams) {
    const { transferQuote, depositArgs, selectedRoute, onNetworkMismatch } =
      params;
    const signer = this.signer;

    if (!transferQuote?.quotedFees) {
      throw new Error("'transferQuote.quotedFees' is required");
    }

    let tx: providers.TransactionResponse;
    const isExclusive =
      depositArgs.exclusivityDeadline > 0 &&
      depositArgs.exclusiveRelayer !== constants.AddressZero;
    const { spokePool, shouldUseSpokePoolVerifier, spokePoolVerifier } =
      await getSpokePoolAndVerifier(selectedRoute);
    const fillDeadline = transferQuote.quotedFees.fillDeadline;
    if (shouldUseSpokePoolVerifier && !isExclusive && spokePoolVerifier) {
      tx = await sendSpokePoolVerifierDepositTx(
        signer,
        {
          ...depositArgs,
          fillDeadline,
        },
        spokePool,
        spokePoolVerifier,
        onNetworkMismatch
      );
    } else {
      tx = await sendDepositV3Tx(
        signer,
        {
          ...depositArgs,
          fillDeadline,
        },
        spokePool,
        onNetworkMismatch
      );
    }
    return tx.hash;
  }

  private async _sendUniversalSwapAndBridgeTx(params: DepositActionParams) {
    const { transferQuote, selectedRoute } = params;

    const signer = this.signer;

    if (!transferQuote?.quotedUniversalSwap) {
      throw new Error("'transferQuote.quotedUniversalSwap' is required");
    }

    if (selectedRoute.type !== "universal-swap") {
      throw new Error("'selectedRoute.type' must be 'universal-swap'");
    }

    const tx = await signer.sendTransaction({
      to: transferQuote.quotedUniversalSwap.swapTx.to,
      data: transferQuote.quotedUniversalSwap.swapTx.data,
      value: transferQuote.quotedUniversalSwap.swapTx.value,
    });

    return tx.hash;
  }

  private async _sendSwapAndBridgeTx(params: DepositActionParams) {
    const { depositArgs, transferQuote, selectedRoute } = params;

    const signer = this.signer;

    if (selectedRoute.type !== "swap") {
      throw new Error("'selectedRoute.type' must be 'swap'");
    }

    if (!transferQuote?.quotedSwap) {
      throw new Error("'transferQuote.quotedSwap' is required");
    }

    const tx = await sendSwapAndBridgeTx(
      signer,
      {
        ...depositArgs,
        inputTokenAddress: selectedRoute.fromTokenAddress,
        outputTokenAddress: selectedRoute.toTokenAddress,
        swapQuote: transferQuote.quotedSwap,
        swapTokenAddress: selectedRoute.swapTokenAddress,
        swapTokenAmount: depositArgs.initialAmount,
        // Current `SwapAndBridge` contract does not support relative exclusivity.
        // Disabling until we update the contract.
        exclusiveRelayer: constants.AddressZero,
        exclusivityDeadline: 0,
        fillDeadline: transferQuote.quotedFees.fillDeadline,
      },
      params.onNetworkMismatch
    );

    return tx.hash;
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

    const message = await this.signHyperliquidMessage(params);

    // Ensure we are on the correct network
    await this.assertCorrectNetwork(selectedRoute.fromChain);

    const { spokePool } = await getSpokePoolAndVerifier(selectedRoute);
    const tx = await sendDepositV3Tx(
      this.signer,
      {
        ...depositArgs,
        inputTokenAddress: selectedRoute.fromTokenAddress,
        outputTokenAddress: selectedRoute.toTokenAddress,
        fillDeadline: transferQuote.quotedFees.fillDeadline,
        message,
        toAddress: acrossPlusMulticallHandler[selectedRoute.toChain],
      },
      spokePool,
      params.onNetworkMismatch
    );

    return tx.hash;
  }

  private async _approveTokens(params: {
    chainId: number;
    tokenSymbol: string;
    amount: BigNumber;
    spender: string;
    owner: string;
  }) {
    const signer = this.signer;

    let tokenInfo = config.getTokenInfoBySymbol(
      params.chainId,
      params.tokenSymbol
    );

    // Special case for Lens GHO
    if (params.chainId === ChainId.LENS && params.tokenSymbol === "GHO") {
      tokenInfo = config.getTokenInfoBySymbol(params.chainId, "WGHO");
    }

    if (this.isWrongNetwork(params.chainId)) {
      await this.switchNetwork(params.chainId);
    }

    const erc20 = ERC20__factory.connect(tokenInfo.address, signer);
    const allowance = await erc20.allowance(params.owner, params.spender);

    if (allowance.gte(params.amount)) {
      return;
    }

    if (allowance.gt(0) && tokenInfo.symbol === "USDT") {
      // USDT has a different approval flow when changing an already approve amount.
      // We need to set the allowance to 0 first.
      // See https://etherscan.io/address/0xdac17f958d2ee523a2206206994597c13d831ec7#code#L201
      const zeroAmountApprovalTx = await erc20.approve(params.spender, 0);
      await waitOnTransaction(params.chainId, zeroAmountApprovalTx);
    }

    const txResponse = await erc20.approve(params.spender, MAX_APPROVAL_AMOUNT);
    await waitOnTransaction(params.chainId, txResponse);
  }
}
