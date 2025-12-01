import { getProvider } from "utils/providers";
import {
  getDepositByTxHash,
  NoFilledRelayLogError,
  parseFilledRelayLogOutputAmount,
} from "utils/deposits";
import { getConfig } from "utils/config";
import { getBlockForTimestamp, paginatedEventQuery } from "utils/sdk";
import {
  chainMaxBlockLookback,
  indexerApiBaseUrl,
  INDIRECT_CHAINS,
} from "utils/constants";
import axios from "axios";
import {
  DepositedInfo,
  DepositInfo,
  DepositStatusResponse,
  FilledInfo,
  FillInfo,
  IChainStrategy,
} from "../types";
import { Deposit } from "hooks/useDeposits";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";
import { BigNumber } from "ethers";
import {
  findSwapMetaDataEventsFromTxHash,
  SwapMetaData,
  SwapSide,
} from "utils/swapMetadata";
import { getSpokepoolRevertReason } from "utils";
import { FilledRelayEvent } from "utils/typechain";

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

      if (deposit.depositTxReceipt.status === 0) {
        const revertReason = await getSpokepoolRevertReason(
          deposit.depositTxReceipt,
          this.chainId
        );

        return {
          depositTxHash: deposit.depositTxReceipt.transactionHash,
          depositTimestamp: deposit.depositTimestamp,
          status: "deposit-reverted",
          depositLog: undefined,
          error: revertReason?.error,
          formattedError: revertReason?.formattedError,
        };
      }

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
        status: "deposited",
        depositLog: deposit.parsedDepositLog,
      };
    } catch (error) {
      console.error("Error fetching EVM deposit:", error);
      throw error;
    }
  }

  getFillChain(): number {
    return INDIRECT_CHAINS?.[this.chainId]?.intermediaryChain ?? this.chainId;
  }

  /**
   * Get fill information for a deposit by checking both indexer and RPC
   * @param depositInfo Deposit information
   * @returns Fill information
   */
  async getFill(depositInfo: DepositedInfo): Promise<FillInfo> {
    const { depositId } = depositInfo.depositLog;
    const fillChainId = this.getFillChain();

    try {
      const fillTxHash = await Promise.any([
        this.getFillFromIndexer(depositInfo),
        this.getFillFromRpc(depositInfo),
      ]);

      if (!fillTxHash) {
        throw new NoFilledRelayLogError(Number(depositId), fillChainId);
      }
      const metadata = await this.getFillMetadata(fillTxHash);

      return {
        fillTxHash: metadata.fillTxHash,
        fillTxTimestamp: metadata.fillTxTimestamp,
        depositInfo,
        status: "filled",
        outputAmount: metadata.outputAmount || BigNumber.from(0),
      };
    } catch (error) {
      // Both rejected - throw error so we can retry
      throw new NoFilledRelayLogError(Number(depositId), fillChainId);
    }
  }

  /**
   * Get fill information for a deposit from indexer
   * @param depositInfo Deposit information
   * @returns Fill transaction hash or null
   */
  async getFillFromIndexer(depositInfo: DepositedInfo): Promise<string> {
    const { originChainId, depositId } = depositInfo.depositLog;

    try {
      const { data } = await axios.get<DepositStatusResponse>(
        `${indexerApiBaseUrl}/deposit/status`,
        {
          params: {
            depositId: depositId.toString(),
            originChainId,
            depositTxHash: depositInfo.depositTxHash,
          },
        }
      );

      if (data?.status === "filled" && data.fillTxnRef) {
        return data.fillTxnRef;
      }

      throw new Error("Indexer response still pending");
    } catch (error) {
      console.warn("Error fetching fill from indexer:", error);
      throw error;
    }
  }

  async getFillFromRpc(depositInfo: DepositedInfo): Promise<string> {
    const { originChainId, depositId } = depositInfo.depositLog;

    try {
      const fillChainId = this.getFillChain();
      const provider = getProvider(fillChainId);
      const [blockForTimestamp, latestBlock] = await Promise.all([
        getBlockForTimestamp(provider, depositInfo.depositTimestamp),
        provider.getBlockNumber(),
      ]);
      const maxLookBack = chainMaxBlockLookback[fillChainId];
      const destinationEventSearchConfig = {
        from: blockForTimestamp,
        to: latestBlock,
        maxLookBack,
      };

      const config = getConfig();
      const destinationSpokePool = config.getSpokePool(fillChainId);
      const filledRelayEvents = (await paginatedEventQuery(
        destinationSpokePool,
        destinationSpokePool.filters.FilledRelay(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          originChainId,
          depositId.toNumber()
        ),
        destinationEventSearchConfig
      )) as FilledRelayEvent[];

      const filledRelayEvent = filledRelayEvents?.[0];

      if (!filledRelayEvent) {
        throw new NoFilledRelayLogError(Number(depositId), fillChainId);
      }

      return filledRelayEvent.transactionHash;
    } catch (error) {
      console.error("Error fetching EVM fill from RPC:", error);
      throw error;
    }
  }

  async getFillMetadata(fillTxHash: string): Promise<{
    fillTxHash: string;
    fillTxTimestamp: number;
    outputAmount: BigNumber | undefined;
  }> {
    try {
      const fillChainId = this.getFillChain();
      const provider = getProvider(fillChainId);
      const fillTxReceipt = await provider.getTransactionReceipt(fillTxHash);
      const [fillTxBlock, swapMetadata] = await Promise.all([
        provider.getBlock(fillTxReceipt.blockNumber),
        this.getSwapMetadata(fillTxHash, fillChainId),
      ]);

      const destinationSwapMetadata = swapMetadata?.find(
        (metadata) => metadata.side === SwapSide.DESTINATION_SWAP
      );

      const outputAmount = destinationSwapMetadata
        ? BigNumber.from(destinationSwapMetadata.expectedAmountOut)
        : parseFilledRelayLogOutputAmount(fillTxReceipt.logs);

      return {
        fillTxHash,
        fillTxTimestamp: fillTxBlock.timestamp,
        outputAmount,
      };
    } catch (e) {
      console.error(`Unable to get fill metadata fro tx hash: ${fillTxHash}`);
      throw e;
    }
  }

  async getSwapMetadata(
    txHash: string,
    fillChainId: number
  ): Promise<SwapMetaData[] | undefined> {
    try {
      const swapMetadata = await findSwapMetaDataEventsFromTxHash(
        txHash,
        getProvider(fillChainId)
      );

      return swapMetadata;
    } catch (error) {
      console.warn(`No swap metadata found for tx with hash ${txHash}`, {
        cause: error,
      });
      return;
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
    fromBridgePagePayload?: FromBridgePagePayload
  ): Deposit {
    throw new Error("Method not implemented.");
    // const config = getConfig();
    // const { selectedRoute, depositArgs, quoteForAnalytics } =
    //   fromBridgePagePayload;
    // const { depositId, depositor, recipient, message, inputAmount } =
    //   depositInfo.depositLog;
    // const inputToken = config.getTokenInfoBySymbolSafe(
    //   selectedRoute.fromChain,
    //   selectedRoute.fromTokenSymbol
    // );
    // const outputToken = config.getTokenInfoBySymbolSafe(
    //   selectedRoute.toChain,
    //   selectedRoute.toTokenSymbol
    // );
    // const swapToken = config.getTokenInfoBySymbolSafe(
    //   selectedRoute.fromChain,
    //   selectedRoute.type === "swap" ? selectedRoute.swapTokenSymbol : ""
    // );

    // return {
    //   depositId: depositId.toString(),
    //   depositTime:
    //     depositInfo.depositTimestamp || Math.floor(Date.now() / 1000),
    //   status: "pending" as const,
    //   filled: "0",
    //   sourceChainId: selectedRoute.fromChain,
    //   destinationChainId: selectedRoute.toChain,
    //   assetAddr:
    //     selectedRoute.type === "swap"
    //       ? selectedRoute.swapTokenAddress
    //       : selectedRoute.fromTokenAddress,
    //   depositorAddr: depositor.toBase58(),
    //   recipientAddr: recipient.toBase58(),
    //   message: message || "0x",
    //   amount: inputAmount.toString(),
    //   depositTxHash: depositInfo.depositTxHash,
    //   fillTx: "",
    //   speedUps: [],
    //   depositRelayerFeePct: depositArgs.relayerFeePct.toString(),
    //   initialRelayerFeePct: depositArgs.relayerFeePct.toString(),
    //   suggestedRelayerFeePct: depositArgs.relayerFeePct.toString(),
    //   feeBreakdown: {
    //     lpFeeUsd: quoteForAnalytics.lpFeeTotalUsd,
    //     lpFeePct: quoteForAnalytics.lpFeePct,
    //     lpFeeAmount: quoteForAnalytics.lpFeeTotal,
    //     relayCapitalFeeUsd: quoteForAnalytics.capitalFeeTotalUsd,
    //     relayCapitalFeePct: quoteForAnalytics.capitalFeePct,
    //     relayCapitalFeeAmount: quoteForAnalytics.capitalFeeTotal,
    //     relayGasFeeUsd: quoteForAnalytics.relayGasFeeTotalUsd,
    //     relayGasFeePct: quoteForAnalytics.relayGasFeePct,
    //     relayGasFeeAmount: quoteForAnalytics.relayFeeTotal,
    //     totalBridgeFeeUsd: quoteForAnalytics.totalBridgeFeeUsd,
    //     totalBridgeFeePct: quoteForAnalytics.totalBridgeFeePct,
    //     totalBridgeFeeAmount: quoteForAnalytics.totalBridgeFee,
    //   },
    //   token: inputToken,
    //   outputToken,
    //   swapToken,
    // };
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
    throw new Error("Method not implemented.");
    // const config = getConfig();
    // const { selectedRoute, depositArgs, quoteForAnalytics } = bridgePayload;
    // const { depositId, depositor, recipient, message, inputAmount } =
    //   fillInfo.depositInfo.depositLog;
    // const inputToken = config.getTokenInfoBySymbolSafe(
    //   selectedRoute.fromChain,
    //   selectedRoute.fromTokenSymbol
    // );
    // const outputToken = config.getTokenInfoBySymbolSafe(
    //   selectedRoute.toChain,
    //   selectedRoute.toTokenSymbol
    // );
    // const swapToken = config.getTokenInfoBySymbolSafe(
    //   selectedRoute.fromChain,
    //   selectedRoute.type === "swap" ? selectedRoute.swapTokenSymbol : ""
    // );

    // return {
    //   depositId: depositId.toString(),
    //   depositTime:
    //     fillInfo.depositInfo.depositTimestamp || Math.floor(Date.now() / 1000),
    //   status: "filled" as const,
    //   filled: inputAmount.toString(),
    //   sourceChainId: selectedRoute.fromChain,
    //   destinationChainId: selectedRoute.toChain,
    //   assetAddr:
    //     selectedRoute.type === "swap"
    //       ? selectedRoute.swapTokenAddress
    //       : selectedRoute.fromTokenAddress,
    //   depositorAddr: depositor.toBytes32(),
    //   recipientAddr: recipient.toBytes32(),
    //   message: message || "0x",
    //   amount: inputAmount.toString(),
    //   depositTxHash: fillInfo.depositInfo.depositTxHash,
    //   fillTx: fillInfo.fillTxHash || "",
    //   speedUps: [],
    //   depositRelayerFeePct: depositArgs.relayerFeePct.toString(),
    //   initialRelayerFeePct: depositArgs.relayerFeePct.toString(),
    //   suggestedRelayerFeePct: depositArgs.relayerFeePct.toString(),
    //   feeBreakdown: {
    //     lpFeeUsd: quoteForAnalytics.lpFeeTotalUsd,
    //     lpFeePct: quoteForAnalytics.lpFeePct,
    //     lpFeeAmount: quoteForAnalytics.lpFeeTotal,
    //     relayCapitalFeeUsd: quoteForAnalytics.capitalFeeTotalUsd,
    //     relayCapitalFeePct: quoteForAnalytics.capitalFeePct,
    //     relayCapitalFeeAmount: quoteForAnalytics.capitalFeeTotal,
    //     relayGasFeeUsd: quoteForAnalytics.relayGasFeeTotalUsd,
    //     relayGasFeePct: quoteForAnalytics.relayGasFeePct,
    //     relayGasFeeAmount: quoteForAnalytics.relayFeeTotal,
    //     totalBridgeFeeUsd: quoteForAnalytics.totalBridgeFeeUsd,
    //     totalBridgeFeePct: quoteForAnalytics.totalBridgeFeePct,
    //     totalBridgeFeeAmount: quoteForAnalytics.totalBridgeFee,
    //   },
    //   token: inputToken,
    //   outputToken,
    //   swapToken,
    // };
  }
}
