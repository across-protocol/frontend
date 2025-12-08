import type {
  DepositEventFromSignature,
  FillEventFromSignature,
} from "@across-protocol/sdk/dist/esm/arch/svm";
import { BigNumber } from "ethers";

import { Deposit } from "hooks/useDeposits";
import { FromBridgePagePayload } from "../../types";

export type BridgeProvider = "across" | "cctp" | "oft";

/**
 * Common types for deposit & fill information
 */
export type DepositData = DepositEventFromSignature;
export type FillData = FillEventFromSignature;

/**
 * Common type for deposit information
 */
export type DepositInfo =
  | {
      depositTxHash: undefined;
      depositTimestamp: undefined;
      status: "depositing";
      depositLog: undefined;
    }
  | {
      depositTxHash: string;
      depositTimestamp: number;
      status: "deposit-reverted";
      depositLog: undefined;
      error?: string | undefined;
      formattedError?: string | undefined;
    }
  | {
      depositTxHash: string;
      depositTimestamp: number;
      status: "deposited";
      depositLog: DepositData;
    };

export type DepositedInfo = Extract<DepositInfo, { status: "deposited" }>;

/**
 * Common type for fill information
 */
export type FillInfo =
  | {
      fillTxHash: undefined;
      fillTxTimestamp: undefined;
      depositInfo: DepositedInfo;
      status: "filling";
      outputAmount: undefined;
    }
  | {
      fillTxHash: string;
      fillTxTimestamp: number;
      depositInfo: DepositedInfo;
      status: "filled" | "fill-reverted";
      outputAmount: BigNumber;
    };

export type FilledInfo = Extract<
  FillInfo,
  { status: "filled" | "fill-reverted" }
>;
// partial taken from https://docs.across.to/reference/api-reference#get-deposit-status
export type DepositStatusResponse =
  | {
      status: "pending";
      fillTxnRef: null;
      swapOutputToken: string | undefined;
      swapOutputAmount: string | undefined;
    }
  | {
      status: "filled";
      fillTxnRef: string;
      swapOutputToken: string | undefined;
      swapOutputAmount: string | undefined;
    };

export type DepositForBurnEvent = {
  amount: bigint;
  burnToken: string; // base58 signature
  depositor: string; // base58 signature
  destinationCaller: string; // base58 signature (20 byte evm address)
  destinationDomain: number; // (int) cctp domain
  destinationTokenMessenger: string; // base58 signature (20 byte evm address)
  maxFee: bigint;
  minFinalityThreshold: number;
  mintRecipient: string; // base58 account (20 byte evm address)
};

/**
 * Common chain strategy interface
 * Each chain implementation adapts its native types to these normalized interfaces
 */
export interface IChainStrategy {
  /**
   * Get deposit information from a transaction
   * @param txIdOrSignature Transaction hash or signature
   * @param bridgeProvider Bridge provider
   * @returns Normalized deposit information
   */
  getDeposit(
    txIdOrSignature: string,
    bridgeProvider: BridgeProvider
  ): Promise<DepositInfo>;

  getFill(
    depositInfo: DepositedInfo,
    bridgeProvider: BridgeProvider
  ): Promise<FillInfo>;

  /**
   * Get fill information for a deposit
   * @param depositInfo Deposit information
   * @param bridgeProvider Bridge provider
   * @returns Normalized fill information
   */
  getFillFromRpc(depositInfo: DepositedInfo): Promise<string>;

  /**
   * Get fill information for a deposit
   * @param depositInfo Deposit information
   * @param toChainId Destination chain ID
   * @returns Normalized fill information
   */
  getFillFromIndexer(depositInfo: DepositedInfo): Promise<string>;

  /**
   * Convert deposit information to local storage format
   * @param depositInfo Normalized deposit information
   * @param fromBridgePagePayload Bridge page payload containing route and quote details
   * @returns Local deposit format for storage
   */
  convertForDepositQuery(
    depositInfo: DepositedInfo,
    fromBridgePagePayload: FromBridgePagePayload
  ): Deposit;

  /**
   * Convert fill information to local storage format
   * @param fillInfo Normalized fill information
   * @param bridgePayload Bridge payload information
   * @returns Local deposit format with fill information
   */
  convertForFillQuery(
    fillInfo: FilledInfo,
    bridgePayload: FromBridgePagePayload
  ): Deposit;

  /**
   * The chain ID this strategy handles
   */
  readonly chainId: number;
}
