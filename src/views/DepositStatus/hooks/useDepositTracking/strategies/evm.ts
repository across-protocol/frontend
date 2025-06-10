import { getProvider } from "utils/providers";
import { getDepositByTxHash, parseFilledRelayLog } from "utils/deposits";
import { getConfig } from "utils/config";
import { getBlockForTimestamp, getMessageHash } from "utils/sdk";
import { NoFilledRelayLogError } from "utils/deposits";
import { indexerApiBaseUrl } from "utils/constants";
import axios from "axios";
import {
  IChainStrategy,
  DepositInfo,
  FillInfo,
  DepositedInfo,
  FilledInfo,
  FillData,
} from "../types";
import { Deposit } from "hooks/useDeposits";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";
import { ethers } from "ethers";

/**
 * Strategy for handling EVM chain operations
 */
export class EVMStrategy implements IChainStrategy {
  constructor(public readonly chainId: number) {}

  /**
   * Get deposit information from an EVM transaction hash
   * @param txHash EVM transaction hash
   * @returns Deposit information
   */
  async getDeposit(txHash: string): Promise<DepositInfo> {
    try {
      const deposit = await getDepositByTxHash(txHash, this.chainId);

      // Create a normalized response
      if (!deposit.depositTimestamp || !deposit.parsedDepositLog) {
        return {
          depositTxHash: undefined,
          depositTimestamp: undefined,
          status: "depositing",
          depositLog: undefined,
        };
      }
      return {
        depositTxHash: deposit.depositTxReceipt.transactionHash,
        depositTimestamp: deposit.depositTimestamp,
        status:
          deposit.depositTxReceipt.status === 0
            ? "deposit-reverted"
            : "deposited",
        depositLog: deposit.parsedDepositLog,
      };
    } catch (error) {
      console.error("Error fetching EVM deposit:", error);
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
    const depositId = depositInfo.depositLog?.depositId;
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
        // Get fill transaction details
        const provider = getProvider(this.chainId);
        const fillTxReceipt = await provider.getTransactionReceipt(data.fillTx);
        const fillTxBlock = await provider.getBlock(fillTxReceipt.blockNumber);

        const parsedFIllLog = parseFilledRelayLog(fillTxReceipt.logs);

        if (!parsedFIllLog) {
          throw new Error(
            `Unable to parse FilledRelay logs for tx ${fillTxReceipt.transactionHash} on Chain ${this.chainId}`
          );
        }

        return {
          fillTxHash: data.fillTx,
          fillTxTimestamp: fillTxBlock.timestamp,
          depositInfo,
          fillLog: {
            ...parsedFIllLog,
            ...parsedFIllLog.args,
            destinationChainId: this.chainId,
            fillTimestamp: fillTxBlock.timestamp,
            blockNumber: parsedFIllLog.blockNumber,
            txnRef: parsedFIllLog.transactionHash,
            txnIndex: parsedFIllLog.transactionIndex,
            logIndex: parsedFIllLog.logIndex,
            originChainId: Number(parsedFIllLog.args.originChainId),
            repaymentChainId: Number(parsedFIllLog.args.repaymentChainId),
            depositId: ethers.BigNumber.from(parsedFIllLog.args.depositId),
            relayExecutionInfo: {
              updatedMessageHash:
                parsedFIllLog.args.messageHash ||
                getMessageHash(
                  parsedFIllLog.args.relayExecutionInfo.updatedMessageHash
                ),
              updatedRecipient:
                parsedFIllLog.args.relayExecutionInfo.updatedRecipient,
              updatedOutputAmount:
                parsedFIllLog.args.relayExecutionInfo.updatedOutputAmount,
              fillType: parsedFIllLog.args.relayExecutionInfo.fillType,
            },
          } as const satisfies FillData,
          status: "filled",
        };
      }
    } catch (error) {
      console.warn("Error fetching fill from API:", error);
    }

    // If API approach didn't work, find the fill on-chain
    try {
      const provider = getProvider(this.chainId);
      const blockForTimestamp = await getBlockForTimestamp(
        provider,
        depositInfo.depositTimestamp
      );

      const config = getConfig();
      const destinationSpokePool = config.getSpokePool(this.chainId);
      const [legacyFilledRelayEvents, newFilledRelayEvents] = await Promise.all(
        [
          destinationSpokePool.queryFilter(
            destinationSpokePool.filters.FilledV3Relay(
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              originChainId,
              depositId.toNumber()
            ),
            blockForTimestamp
          ),
          destinationSpokePool.queryFilter(
            destinationSpokePool.filters.FilledRelay(
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              originChainId,
              depositId.toNumber()
            ),
            blockForTimestamp
          ),
        ]
      );
      const filledRelayEvents = [
        ...legacyFilledRelayEvents,
        ...newFilledRelayEvents,
      ];
      // If we make it to this point, we can be sure that there is exactly one filled relay event
      // that corresponds to the deposit we are looking for.
      // The (depositId, fromChainId) tuple is unique for V3 filled relay events.
      const filledRelayEvent = filledRelayEvents?.[0];

      if (!filledRelayEvent) {
        throw new NoFilledRelayLogError(Number(depositId), this.chainId);
      }
      const messageHash =
        "messageHash" in filledRelayEvent.args
          ? filledRelayEvent.args.messageHash
          : getMessageHash(filledRelayEvent.args.message);

      const updatedMessageHash =
        "updatedMessageHash" in filledRelayEvent.args.relayExecutionInfo
          ? filledRelayEvent.args.relayExecutionInfo.updatedMessageHash
          : messageHash;

      const fillTxBlock = await filledRelayEvent.getBlock();

      return {
        fillTxHash: filledRelayEvent.transactionHash,
        fillTxTimestamp: fillTxBlock.timestamp,
        depositInfo,
        fillLog: {
          ...filledRelayEvent,
          ...filledRelayEvent.args,
          messageHash,
          destinationChainId: this.chainId,
          fillTimestamp: fillTxBlock.timestamp,
          blockNumber: filledRelayEvent.blockNumber,
          txnRef: filledRelayEvent.transactionHash,
          txnIndex: filledRelayEvent.transactionIndex,
          logIndex: filledRelayEvent.logIndex,
          originChainId: Number(filledRelayEvent.args.originChainId),
          repaymentChainId: Number(filledRelayEvent.args.repaymentChainId),
          depositId: ethers.BigNumber.from(filledRelayEvent.args.depositId),
          relayExecutionInfo: {
            ...filledRelayEvent.args.relayExecutionInfo,
            updatedMessageHash,
          },
        } satisfies FillData,
        status: "filled",
      };
    } catch (error) {
      if (error instanceof NoFilledRelayLogError) {
        // If no fill found, return a filling status
        return {
          fillTxHash: undefined,
          fillTxTimestamp: undefined,
          depositInfo,
          status: "filling",
          fillLog: undefined,
        };
      }

      console.error("Error fetching EVM fill:", error);
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
    const inputToken = config.getTokenInfoBySymbol(
      selectedRoute.fromChain,
      selectedRoute.fromTokenSymbol
    );
    const outputToken = config.getTokenInfoBySymbol(
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
      depositorAddr: depositor,
      recipientAddr: recipient,
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
    const inputToken = config.getTokenInfoBySymbol(
      selectedRoute.fromChain,
      selectedRoute.fromTokenSymbol
    );
    const outputToken = config.getTokenInfoBySymbol(
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
      depositorAddr: depositor,
      recipientAddr: recipient,
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
}
