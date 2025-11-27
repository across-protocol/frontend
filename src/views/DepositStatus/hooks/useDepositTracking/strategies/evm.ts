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

    let fillChainId = this.chainId;
    if (INDIRECT_CHAINS[this.chainId]) {
      fillChainId = INDIRECT_CHAINS[this.chainId]?.intermediaryChain;
    }

    try {
      // First try the rewards API
      const { data } = await axios.get<{
        status: "filled" | "pending";
        fillTx: string | null;
        swapOutputToken: string | undefined;
        swapOutputAmount: string | undefined;
      }>(`${indexerApiBaseUrl}/deposit/status`, {
        params: {
          originChainId,
          depositId: depositId.toString(),
          depositTxHash: depositInfo.depositTxHash,
        },
      });

      if (data?.status === "filled" && data.fillTx) {
        // Get fill transaction details
        const provider = getProvider(fillChainId);
        const fillTxReceipt = await provider.getTransactionReceipt(data.fillTx);
        const fillTxBlock = await provider.getBlock(fillTxReceipt.blockNumber);

        const swapMetadata = await this.getSwapMetadata(
          data.fillTx,
          fillChainId
        );
        const destinationSwapMetadata = swapMetadata?.find(
          (metadata) => metadata.side === SwapSide.DESTINATION_SWAP
        );

        const outputAmount = destinationSwapMetadata
          ? BigNumber.from(destinationSwapMetadata.expectedAmountOut)
          : parseFilledRelayLogOutputAmount(fillTxReceipt.logs);

        if (!outputAmount) {
          throw new Error(
            `Unable to parse output amount from FilledRelay logs for tx ${fillTxReceipt.transactionHash} on Chain ${fillChainId}`
          );
        }

        return {
          fillTxHash: data.fillTx,
          fillTxTimestamp: fillTxBlock.timestamp,
          depositInfo,
          outputAmount,
          status: "filled",
        };
      }
    } catch (error) {
      console.warn("Error fetching fill from API:", error);
    }

    // If API approach didn't work, find the fill on-chain
    try {
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
      // If we make it to this point, we can be sure that there is exactly one filled relay event
      // that corresponds to the deposit we are looking for.
      // The (depositId, fromChainId) tuple is unique for V3 filled relay events.
      const filledRelayEvent = filledRelayEvents?.[0];

      if (!filledRelayEvent) {
        throw new NoFilledRelayLogError(Number(depositId), fillChainId);
      }

      const fillTxBlock = await filledRelayEvent.getBlock();

      const swapMetadata = await this.getSwapMetadata(
        filledRelayEvent.transactionHash,
        fillChainId
      );
      const destinationSwapMetadata = swapMetadata?.find(
        (metadata) => metadata.side === SwapSide.DESTINATION_SWAP
      );

      const outputAmount = destinationSwapMetadata
        ? BigNumber.from(destinationSwapMetadata.expectedAmountOut)
        : filledRelayEvent.args.outputAmount;

      return {
        fillTxHash: filledRelayEvent.transactionHash,
        fillTxTimestamp: fillTxBlock.timestamp,
        depositInfo,
        outputAmount,
        status: "filled",
      };
    } catch (error) {
      console.error("Error fetching EVM fill:", error);
      throw error;
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
