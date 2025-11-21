import { getConfig } from "utils/config";
import axios from "axios";
import { indexerApiBaseUrl } from "utils/constants";
import {
  IChainStrategy,
  DepositInfo,
  FillInfo,
  DepositedInfo,
  FilledInfo,
  DepositData,
  FillData,
} from "../types";
import {
  getSVMRpc,
  NoFilledRelayLogError,
  SvmCpiEventsClient,
  SVMBlockFinder,
  toAddressType,
  findFillEvent,
  isBigNumberish,
  uint8ArrayToBigNumber,
} from "utils";
import { isSignature } from "@solana/kit";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";
import { Deposit } from "hooks/useDeposits";
import { RelayData } from "@across-protocol/sdk/dist/esm/interfaces";
import { BigNumber } from "ethers";
import { SvmSpokeClient } from "@across-protocol/contracts";
import { hexlify } from "ethers/lib/utils";
import { isHex } from "viem";

/**
 * Strategy for handling Solana (SVM) chain operations
 */
export class SVMStrategy implements IChainStrategy {
  constructor(public readonly chainId: number) {}

  /**
   * Get deposit information from a Solana transaction signature
   * @param txSignature Solana transaction signature
   * @returns Deposit information
   */
  async getDeposit(txSignature: string): Promise<DepositInfo> {
    try {
      if (!isSignature(txSignature)) {
        throw new Error(`Invalid signature: ${txSignature}`);
      }
      const rpc = getSVMRpc(this.chainId);
      const eventsClient = await SvmCpiEventsClient.create(rpc);

      const depositEventsAtSignature =
        await eventsClient.getDepositEventsFromSignature(
          this.chainId,
          txSignature
        );

      const tx = depositEventsAtSignature?.[0];

      if (!tx) {
        return {
          depositTxHash: undefined,
          depositTimestamp: undefined,
          status: "depositing",
          depositLog: undefined,
        };
      }

      return {
        depositTxHash: txSignature,
        depositTimestamp: tx.depositTimestamp,
        status: "deposited",
        depositLog: tx satisfies DepositData,
      };
    } catch (error) {
      console.error("Error fetching Solana deposit:", error);
      throw error;
    }
  }

  /**
   * Get fill information for a deposit
   * @param depositInfo Deposit information
   * @param toChainId Destination chain ID
   * @returns Fill information
   */
  async getFill(depositInfo: DepositedInfo): Promise<FillInfo> {
    const depositId = depositInfo.depositLog.depositId;
    const originChainId = depositInfo.depositLog.originChainId;

    if (!depositId) {
      throw new Error("Deposit ID not found in deposit information");
    }

    try {
      // First try the rewards API
      const { data } = await axios.get<{
        status: "filled" | "pending";
        fillTx: string | null;
      }>(`${indexerApiBaseUrl}/deposit/status`, {
        params: {
          originChainId,
          depositId: depositId.toString(),
          depositTxHash: depositInfo.depositTxHash,
        },
      });

      if (data?.status === "filled" && data.fillTx) {
        if (!isSignature(data.fillTx)) {
          throw new Error(
            `Invalid Signature: ${data.fillTx}. \nChain ${this.chainId} is likely not an svm chain.`
          );
        }
        const rpc = getSVMRpc(this.chainId);
        const eventsClient = await SvmCpiEventsClient.create(rpc);
        const fillTx = await eventsClient.getFillEventsFromSignature(
          this.chainId,
          data.fillTx
        );

        const fillTxDetails = fillTx?.[0];
        if (!fillTxDetails) {
          throw new Error(
            `Unable to find fill with signature ${data.fillTx} on chain ${this.chainId}`
          );
        }

        return {
          fillTxHash: data.fillTx,
          fillTxTimestamp: Number(fillTxDetails.fillTimestamp),
          status: "filled",
          depositInfo,
          fillLog: fillTxDetails satisfies FillData,
        };
      }
    } catch (error) {
      console.warn("Error fetching fill from API:", error);
    }

    // If API approach didn't work, find the fill on-chain
    try {
      const rpc = getSVMRpc(this.chainId);
      const eventsClient = await SvmCpiEventsClient.create(rpc);

      const fromSlot = (
        await new SVMBlockFinder(rpc).getBlockForTimestamp(
          depositInfo.depositTimestamp
        )
      )?.number;

      const formattedRelayData = this.formatRelayData(depositInfo.depositLog);

      const fillEvent = await findFillEvent(
        formattedRelayData,
        this.chainId,
        eventsClient,
        fromSlot
      );

      if (!fillEvent) {
        throw new NoFilledRelayLogError(Number(depositId), this.chainId);
      }

      const fillTxTimestamp = await rpc
        .getBlockTime(BigInt(fillEvent.blockNumber))
        .send();

      return {
        fillTxHash: fillEvent.txnRef,
        fillTxTimestamp: Number(fillTxTimestamp),
        fillLog: {
          ...fillEvent,
          fillTimestamp: Number(fillTxTimestamp),
        } satisfies FillData,
        depositInfo,
        status: "filled",
      };
    } catch (error) {
      console.error("Error fetching Solana fill:", error);
      throw error;
    }
  }

  /**
   * Convert deposit information to local storage format for EVM chains
   * @param depositInfo Deposit information
   * @param bridgePayload Bridge page payload
   * @returns Local deposit format for storage
   */

  convertForDepositQuery(
    depositInfo: DepositedInfo,
    fromBridgePagePayload: FromBridgePagePayload
  ): Deposit {
    const config = getConfig();
    const { selectedRoute, depositArgs, quoteForAnalytics } =
      fromBridgePagePayload;
    const { depositId, depositor, recipient, message, inputAmount } =
      depositInfo.depositLog;
    const inputToken = config.getTokenInfoBySymbolSafe(
      selectedRoute.fromChain,
      selectedRoute.fromTokenSymbol
    );
    const outputToken = config.getTokenInfoBySymbolSafe(
      selectedRoute.toChain,
      selectedRoute.toTokenSymbol
    );
    const swapToken = config.getTokenInfoBySymbolSafe(
      selectedRoute.fromChain,
      selectedRoute.type === "swap" ? selectedRoute.swapTokenSymbol : ""
    );

    return {
      depositId: depositId.toString(),
      depositTime:
        depositInfo.depositTimestamp || Math.floor(Date.now() / 1000),
      status: "pending" as const,
      filled: "0",
      sourceChainId: selectedRoute.fromChain,
      destinationChainId: selectedRoute.toChain,
      assetAddr:
        selectedRoute.type === "swap"
          ? selectedRoute.swapTokenAddress
          : selectedRoute.fromTokenAddress,
      depositorAddr: depositor.toBytes32(),
      recipientAddr: recipient.toBytes32(),
      message: message || "0x",
      amount: inputAmount.toString(),
      depositTxHash: depositInfo.depositTxHash,
      fillTx: "",
      speedUps: [],
      depositRelayerFeePct: depositArgs.relayerFeePct.toString(),
      initialRelayerFeePct: depositArgs.relayerFeePct.toString(),
      suggestedRelayerFeePct: depositArgs.relayerFeePct.toString(),
      feeBreakdown: {
        lpFeeUsd: quoteForAnalytics.lpFeeTotalUsd,
        lpFeePct: quoteForAnalytics.lpFeePct,
        lpFeeAmount: quoteForAnalytics.lpFeeTotal,
        relayCapitalFeeUsd: quoteForAnalytics.capitalFeeTotalUsd,
        relayCapitalFeePct: quoteForAnalytics.capitalFeePct,
        relayCapitalFeeAmount: quoteForAnalytics.capitalFeeTotal,
        relayGasFeeUsd: quoteForAnalytics.relayGasFeeTotalUsd,
        relayGasFeePct: quoteForAnalytics.relayGasFeePct,
        relayGasFeeAmount: quoteForAnalytics.relayFeeTotal,
        totalBridgeFeeUsd: quoteForAnalytics.totalBridgeFeeUsd,
        totalBridgeFeePct: quoteForAnalytics.totalBridgeFeePct,
        totalBridgeFeeAmount: quoteForAnalytics.totalBridgeFee,
      },
      token: inputToken,
      outputToken,
      swapToken,
    };
  }

  /**
   * Convert fill information to local storage format for EVM chains
   * @param fillInfo Fill information
   * @param bridgePayload Bridge page payload
   * @returns Local deposit format with fill information
   */

  convertForFillQuery(
    fillInfo: FilledInfo,
    bridgePayload: FromBridgePagePayload
  ): Deposit {
    const config = getConfig();
    const { selectedRoute, depositArgs, quoteForAnalytics } = bridgePayload;
    const { depositId, depositor, recipient, message, inputAmount } =
      fillInfo.depositInfo.depositLog;
    const inputToken = config.getTokenInfoBySymbolSafe(
      selectedRoute.fromChain,
      selectedRoute.fromTokenSymbol
    );
    const outputToken = config.getTokenInfoBySymbolSafe(
      selectedRoute.toChain,
      selectedRoute.toTokenSymbol
    );
    const swapToken = config.getTokenInfoBySymbolSafe(
      selectedRoute.fromChain,
      selectedRoute.type === "swap" ? selectedRoute.swapTokenSymbol : ""
    );

    return {
      depositId: depositId.toString(),
      depositTime:
        fillInfo.depositInfo.depositTimestamp || Math.floor(Date.now() / 1000),
      status: "filled" as const,
      filled: inputAmount.toString(),
      sourceChainId: selectedRoute.fromChain,
      destinationChainId: selectedRoute.toChain,
      assetAddr:
        selectedRoute.type === "swap"
          ? selectedRoute.swapTokenAddress
          : selectedRoute.fromTokenAddress,
      depositorAddr: depositor.toBytes32(),
      recipientAddr: recipient.toBytes32(),
      message: message || "0x",
      amount: inputAmount.toString(),
      depositTxHash: fillInfo.depositInfo.depositTxHash,
      fillTx: fillInfo.fillTxHash || "",
      speedUps: [],
      depositRelayerFeePct: depositArgs.relayerFeePct.toString(),
      initialRelayerFeePct: depositArgs.relayerFeePct.toString(),
      suggestedRelayerFeePct: depositArgs.relayerFeePct.toString(),
      feeBreakdown: {
        lpFeeUsd: quoteForAnalytics.lpFeeTotalUsd,
        lpFeePct: quoteForAnalytics.lpFeePct,
        lpFeeAmount: quoteForAnalytics.lpFeeTotal,
        relayCapitalFeeUsd: quoteForAnalytics.capitalFeeTotalUsd,
        relayCapitalFeePct: quoteForAnalytics.capitalFeePct,
        relayCapitalFeeAmount: quoteForAnalytics.capitalFeeTotal,
        relayGasFeeUsd: quoteForAnalytics.relayGasFeeTotalUsd,
        relayGasFeePct: quoteForAnalytics.relayGasFeePct,
        relayGasFeeAmount: quoteForAnalytics.relayFeeTotal,
        totalBridgeFeeUsd: quoteForAnalytics.totalBridgeFeeUsd,
        totalBridgeFeePct: quoteForAnalytics.totalBridgeFeePct,
        totalBridgeFeeAmount: quoteForAnalytics.totalBridgeFee,
      },
      token: inputToken,
      outputToken,
      swapToken,
    };
  }

  // deposit could be from svm or evm
  private formatRelayData(
    relayData: RelayData | SvmSpokeClient.RelayDataArgs
  ): RelayData {
    return {
      originChainId: Number(relayData.originChainId),
      depositor: toAddressType(
        relayData.depositor.toString(),
        Number(relayData.originChainId)
      ),
      depositId: isBigNumberish(relayData.depositId)
        ? BigNumber.from(relayData.depositId)
        : uint8ArrayToBigNumber(relayData.depositId),
      recipient: toAddressType(
        relayData.recipient.toString(),
        Number(this.chainId)
      ),
      inputToken: toAddressType(
        relayData.inputToken.toString(),
        Number(relayData.originChainId)
      ),
      outputToken: toAddressType(
        relayData.outputToken.toString(),
        Number(this.chainId)
      ),
      inputAmount: isBigNumberish(relayData.inputAmount)
        ? BigNumber.from(relayData.inputAmount)
        : uint8ArrayToBigNumber(relayData.inputAmount),
      outputAmount: BigNumber.from(relayData.outputAmount),
      fillDeadline: relayData.fillDeadline,
      exclusivityDeadline: relayData.exclusivityDeadline,
      message: isHex(relayData.message)
        ? relayData.message
        : hexlify(relayData.message),
      exclusiveRelayer: toAddressType(
        relayData.exclusiveRelayer.toString(),
        Number(this.chainId)
      ),
    };
  }
}
