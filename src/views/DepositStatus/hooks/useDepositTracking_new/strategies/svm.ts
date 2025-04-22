import { getConfig } from "utils/config";
import axios from "axios";
import { rewardsApiUrl } from "utils/constants";
import { IChainStrategy, DepositInfo, FillInfo } from "../types";
import { getSVMProvider } from "utils";

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
      // Get Solana provider
      const solanaProvider = getSVMProvider(this.chainId);

      // Get transaction details
      const txDetails = await solanaProvider.getTransaction(txSignature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });

      if (!txDetails) {
        throw new Error(
          `Could not fetch tx details for ${txSignature} on Solana chain ${this.chainId}`
        );
      }

      // Check transaction success
      const successful = txDetails.meta?.err === null;

      // Get the timestamp
      const blockTime = txDetails.blockTime ? txDetails.blockTime : 0;

      if (!successful) {
        return {
          depositTxHash: txSignature,
          depositTimestamp: blockTime,
          depositor: "",
          amount: "0",
          status: "deposit-reverted",
        };
      }

      // Parse deposit information by finding the CPI event
      const depositData = await this.findDepositEventFromTransaction(txDetails);

      if (!depositData) {
        throw new Error(`Could not find deposit event in tx ${txSignature}`);
      }

      return {
        depositTxHash: txSignature,
        depositTimestamp: blockTime,
        depositor: depositData.depositor,
        amount: depositData.amount,
        status: "deposited",
        parsedDepositLog: depositData,
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
  async getFill(
    depositInfo: DepositInfo,
    toChainId: number
  ): Promise<FillInfo> {
    const depositId = depositInfo.parsedDepositLog?.depositId;

    if (!depositId) {
      throw new Error("Deposit ID not found in deposit information");
    }

    try {
      // First try the rewards API
      const { data } = await axios.get<{
        status: "filled" | "pending";
        fillTx: string | null;
      }>(`${rewardsApiUrl}/deposit/status`, {
        params: {
          depositId: depositId.toString(),
          originChainId: this.chainId,
        },
      });

      if (data?.status === "filled" && data.fillTx) {
        // Get Solana transaction details
        const solanaProvider = getSVMProvider(toChainId);

        const fillTxDetails = await solanaProvider.getTransaction(data.fillTx, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });

        if (!fillTxDetails) {
          throw new Error(
            `Could not fetch fill tx details for ${data.fillTx} on Solana chain ${toChainId}`
          );
        }

        return {
          fillTxHashes: [data.fillTx],
          fillTxTimestamp: fillTxDetails.blockTime || 0,
          depositInfo,
          recipient: depositInfo.depositor,
          amount: depositInfo.amount,
          status: "filled",
        };
      }
    } catch (error) {
      console.warn("Error fetching fill from API:", error);
    }

    // If API approach didn't work, find the fill on-chain
    try {
      const fillData = await this.findFillEventOnChain(
        depositId,
        depositInfo,
        toChainId
      );

      if (!fillData) {
        // No fill found, return filling status
        return {
          fillTxHashes: [],
          fillTxTimestamp: 0,
          depositInfo,
          recipient: depositInfo.depositor,
          amount: depositInfo.amount,
          status: "filling",
        };
      }

      return {
        fillTxHashes: [fillData.signature],
        fillTxTimestamp: fillData.timestamp,
        depositInfo,
        recipient: fillData.recipient || depositInfo.depositor,
        amount: fillData.amount || depositInfo.amount,
        status: "filled",
      };
    } catch (error) {
      console.error("Error fetching Solana fill:", error);

      // Return filling status if we can't determine the fill
      return {
        fillTxHashes: [],
        fillTxTimestamp: 0,
        depositInfo,
        recipient: depositInfo.depositor,
        amount: depositInfo.amount,
        status: "filling",
      };
    }
  }

  /**
   * Find the deposit event from a Solana transaction by calculating the event PDA
   * @param txDetails Transaction details
   * @returns Parsed deposit data or undefined if not found
   */
  private async findDepositEventFromTransaction(
    txDetails: any
  ): Promise<any | undefined> {
    try {
      const config = getConfig();
      const programId = config.getSpokePoolProgramId(this.chainId);
      const solanaProvider = getSVMProvider(this.chainId);

      // This is where you would implement the Solana-specific logic to:
      // 1. Calculate the event PDA for the deposit
      // 2. Query for events at that PDA
      // 3. Parse and return the event data

      // Stub implementation - replace with actual SDK implementation
      // Example approach:
      // 1. Extract transaction ID or signature
      // 2. Calculate the event PDA using program seeds
      // 3. Query the account data at that PDA

      // For now, returning a placeholder object
      return {
        depositor: txDetails.transaction.message.accountKeys[0].toString(),
        amount: "1000000", // Placeholder amount
        depositId: 123, // Placeholder deposit ID
      };
    } catch (error) {
      console.error("Error parsing Solana deposit event:", error);
      return undefined;
    }
  }

  /**
   * Find the fill event on-chain using the deposit ID
   * @param depositId Deposit ID to search for
   * @param depositInfo Original deposit information
   * @param toChainId Destination chain ID
   * @returns Fill data if found
   */
  private async findFillEventOnChain(
    depositId: number,
    depositInfo: DepositInfo,
    toChainId: number
  ): Promise<
    | {
        signature: string;
        timestamp: number;
        recipient?: string;
        amount?: string;
      }
    | undefined
  > {
    try {
      const config = getConfig();
      const programId = config.getSpokePoolProgramId(toChainId);
      const solanaProvider = getSVMProvider(toChainId);

      // This is where you would implement the Solana-specific logic to:
      // 1. Calculate the event PDA for the fill based on the deposit ID
      // 2. Query for events at that PDA
      // 3. Parse and return the event data

      // Stub implementation - replace with actual SDK implementation
      // Example approach:
      // 1. Calculate a PDA for the fill account using the deposit ID and origin chain
      // const [fillPda] = await PublicKey.findProgramAddress(
      //   [Buffer.from("fill"), Buffer.from(depositId.toString()), Buffer.from(this.chainId.toString())],
      //   new PublicKey(programId)
      // );
      //
      // 2. Fetch the account data
      // const fillAccount = await solanaProvider.getAccountInfo(fillPda);
      //
      // 3. Parse the fill data (will depend on your program schema)

      // For now, just return undefined to indicate no fill found
      return undefined;

      // When implementing, return actual data like:
      // return {
      //   signature: "fillTransactionSignature",
      //   timestamp: fillTimestamp,
      //   recipient: fillRecipient,
      //   amount: fillAmount.toString(),
      // };
    } catch (error) {
      console.error("Error finding Solana fill event:", error);
      return undefined;
    }
  }

  /**
   * Convert deposit information to local storage format for SVM chains
   * @param depositInfo Deposit information
   * @param bridgePayload Bridge page payload
   * @returns Local deposit format for storage
   */
  convertForDepositQuery(
    depositInfo: DepositInfo,
    bridgePayload: any
  ): LocalDepositInfo {
    const { quoteForAnalytics } = bridgePayload;

    return {
      depositTxHash: depositInfo.depositTxHash,
      amount: bridgePayload.depositArgs.amount,
      fromChainId: Number(quoteForAnalytics.fromChainId),
      toChainId: Number(quoteForAnalytics.toChainId),
      tokenSymbol: quoteForAnalytics.tokenSymbol,
      depositTimestamp: depositInfo.depositTimestamp,
      depositStatus: depositInfo.status,
      fillStatus: "filling",
      fillTimestamp: null,
      fillTxHash: null,
    };
  }

  /**
   * Convert fill information to local storage format for SVM chains
   * @param fillInfo Fill information
   * @param bridgePayload Bridge page payload
   * @returns Local deposit format with fill information
   */
  convertForFillQuery(
    fillInfo: FillInfo,
    bridgePayload: any
  ): LocalDepositInfo {
    const { quoteForAnalytics } = bridgePayload;
    const depositInfo = fillInfo.depositInfo;

    return {
      depositTxHash: depositInfo.depositTxHash,
      amount: bridgePayload.depositArgs.amount,
      fromChainId: Number(quoteForAnalytics.fromChainId),
      toChainId: Number(quoteForAnalytics.toChainId),
      tokenSymbol: quoteForAnalytics.tokenSymbol,
      depositTimestamp: depositInfo.depositTimestamp,
      depositStatus: depositInfo.status,
      fillStatus: fillInfo.status,
      fillTimestamp: fillInfo.fillTxTimestamp,
      fillTxHash:
        fillInfo.fillTxHashes.length > 0 ? fillInfo.fillTxHashes[0] : null,
    };
  }
}
