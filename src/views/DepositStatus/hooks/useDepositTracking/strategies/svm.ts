import axios from "axios";
import { indexerApiBaseUrl } from "utils/constants";
import {
  BridgeProvider,
  DepositData,
  DepositedInfo,
  DepositStatusResponse,
  FilledInfo,
  FillFromIndexerResult,
  IChainStrategy,
  FillMetadata,
} from "../types";
import {
  findFillEvent,
  getDepositBySignatureSVM,
  getSVMRpc,
  isBigNumberish,
  NoFilledRelayLogError,
  FillPendingError,
  FillMetadataParseError,
  TransactionPendingError,
  TransactionNotFoundError,
  SVMBlockFinder,
  SvmCpiEventsClient,
  toAddressType,
  uint8ArrayToBigNumber,
} from "utils";
import { isSignature } from "@solana/kit";
import { RelayData } from "@across-protocol/sdk/dist/esm/interfaces";
import { BigNumber } from "ethers";
import { SvmSpokeClient } from "@across-protocol/contracts";
import { hexlify } from "ethers/lib/utils";
import { isHex } from "viem";
import {
  getDepositForBurnBySignatureSVM,
  getMintAndBurnBySignatureSVM,
} from "utils/cctp";
import { getFillTxBySignature } from "utils/fills";

/**
 * Strategy for handling Solana (SVM) chain operations
 */
export class SVMStrategy implements IChainStrategy {
  constructor(public readonly chainId: number) {}

  /**
   * Get deposit information from a Solana transaction signature
   * @param txSignature Solana transaction signature
   * @param bridgeProvider across intents, cctp, oft etc.
   * @returns Deposit information
   */
  async getDeposit(
    txSignature: string,
    bridgeProvider: BridgeProvider
  ): Promise<DepositedInfo> {
    if (!isSignature(txSignature)) {
      throw new TransactionNotFoundError(txSignature, this.chainId);
    }

    const tx = ["cctp", "sponsored-cctp"].includes(bridgeProvider)
      ? await getDepositForBurnBySignatureSVM({
          signature: txSignature,
          chainId: this.chainId,
        })
      : await getDepositBySignatureSVM({
          signature: txSignature,
          chainId: this.chainId,
        });

    if (!tx) {
      throw new TransactionPendingError(txSignature, this.chainId);
    }

    return {
      depositTxHash: txSignature,
      depositTimestamp: tx.depositTimestamp,
      status: "deposited",
      depositLog: tx satisfies DepositData,
    };
  }

  /**
   * Get fill information for a deposit by checking both indexer and RPC
   * @param depositInfo Deposit information
   * @param bridgeProvider across intents, cctp, oft etc.
   * @returns Fill information
   */
  async getFill(
    depositInfo: DepositedInfo,
    bridgeProvider: BridgeProvider = "across"
  ): Promise<FilledInfo> {
    const { depositId } = depositInfo.depositLog;
    const fillChainId = this.chainId;

    // Use indexer to get fill info with actionsSucceeded
    const indexerResult = await this.getFillFromIndexer(depositInfo);

    if (!indexerResult.fillTxnRef) {
      throw new NoFilledRelayLogError(Number(depositId), fillChainId);
    }

    const metadata = await this.getFillMetadata(
      indexerResult.fillTxnRef,
      bridgeProvider
    );

    if (!metadata) {
      throw new FillMetadataParseError(indexerResult.fillTxnRef, fillChainId);
    }

    return {
      fillTxHash: metadata.fillTxHash,
      fillTxTimestamp: metadata.fillTxTimestamp,
      depositInfo,
      status: "filled",
      outputAmount: metadata.outputAmount || BigNumber.from(0),
      actionsSucceeded: indexerResult.actionsSucceeded,
      outputToken: indexerResult.outputToken,
    };
  }

  /**
   * Get fill information for a deposit from indexer
   * @param depositInfo Deposit information
   * @returns Fill info including fillTxnRef, actionsSucceeded, and outputToken
   */
  async getFillFromIndexer(
    depositInfo: DepositedInfo
  ): Promise<FillFromIndexerResult> {
    const { depositId } = depositInfo.depositLog;

    try {
      const { data } = await axios.get<DepositStatusResponse>(
        `${indexerApiBaseUrl}/deposit/status`,
        {
          params: {
            depositId: depositId.toString(),
            depositTxHash: depositInfo.depositTxHash,
          },
        }
      );

      if (data?.status === "filled" && data.fillTxnRef) {
        if (!isSignature(data.fillTxnRef)) {
          throw new FillMetadataParseError(data.fillTxnRef, this.chainId);
        }
        return {
          fillTxnRef: data.fillTxnRef,
          actionsSucceeded: data.actionsSucceeded ?? null,
          outputToken: data.outputToken,
        };
      }

      throw new FillPendingError("Indexer response still pending");
    } catch (error) {
      console.warn("Error fetching fill from indexer:", error);
      throw error;
    }
  }

  /**
   * Get fill information for a deposit from RPC
   * @param depositInfo Deposit information
   * @returns Fill transaction hash (signature)
   */
  async getFillFromRpc(
    depositInfo: DepositedInfo,
    bridgeProvider: BridgeProvider
  ): Promise<string> {
    const { depositId } = depositInfo.depositLog;

    try {
      const rpc = getSVMRpc(this.chainId);
      const eventsClient = await SvmCpiEventsClient.create(rpc);

      const fromSlot = (
        await new SVMBlockFinder(rpc).getBlockForTimestamp(
          depositInfo.depositTimestamp
        )
      )?.number;

      let fillEventTxRef = "";

      if (bridgeProvider === "cctp") {
        // noop
        throw new NoFilledRelayLogError(Number(depositId), this.chainId);
      } else {
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
        fillEventTxRef = fillEvent.txnRef;
      }

      return fillEventTxRef;
    } catch (error) {
      console.error("Error fetching Solana fill from RPC:", error);
      throw error;
    }
  }

  /**
   * Get fill metadata (timestamp and output amount) from a fill transaction signature
   * @param fillTxHash Fill transaction hash (signature)
   * @returns Fill metadata
   */
  async getFillMetadata(
    fillTxHash: string,
    bridgeProvider: BridgeProvider
  ): Promise<FillMetadata | undefined> {
    try {
      if (!isSignature(fillTxHash)) {
        throw new FillMetadataParseError(fillTxHash, this.chainId);
      }
      const fillTx = ["cctp", "sponsored-cctp"].includes(bridgeProvider)
        ? await getMintAndBurnBySignatureSVM({
            signature: fillTxHash,
            chainId: this.chainId,
          })
        : await getFillTxBySignature({
            signature: fillTxHash,
            chainId: this.chainId,
          });

      if (!fillTx) {
        throw new FillMetadataParseError(fillTxHash, this.chainId);
      }

      return {
        fillTxHash,
        fillTxTimestamp: Number(fillTx.fillTxTimestamp),
        outputAmount: BigNumber.from(fillTx.outputAmount),
      };
    } catch (error) {
      console.error(
        `Unable to get fill metadata for tx hash: ${fillTxHash}`,
        error
      );
      throw error;
    }
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
