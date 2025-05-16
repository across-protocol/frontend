import {
  DepositEventFromSignature,
  FillEventFromSignature,
} from "@across-protocol/sdk/dist/esm/arch/svm";

import { Deposit } from "hooks/useDeposits";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";

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
      status: "deposit-reverted" | "deposited";
      depositLog: DepositData;
    };

export type DepositedInfo = Extract<
  DepositInfo,
  { status: "deposit-reverted" | "deposited" }
>;

/**
 * Common type for fill information
 */
export type FillInfo =
  | {
      fillTxHash: undefined;
      fillTxTimestamp: undefined;
      depositInfo: DepositedInfo;
      status: "filling";
      fillLog: undefined;
    }
  | {
      fillTxHash: string;
      fillTxTimestamp: number;
      depositInfo: DepositedInfo;
      status: "filled" | "fill-reverted";
      fillLog: FillData;
    };

export type FilledInfo = Extract<
  FillInfo,
  { status: "filled" | "fill-reverted" }
>;

/**
 * Common chain strategy interface
 * Each chain implementation adapts its native types to these normalized interfaces
 */
export interface IChainStrategy {
  /**
   * Get deposit information from a transaction
   * @param txIdOrSignature Transaction hash or signature
   * @returns Normalized deposit information
   */
  getDeposit(txIdOrSignature: string): Promise<DepositInfo>;

  /**
   * Get fill information for a deposit
   * @param depositInfo Deposit information
   * @param toChainId Destination chain ID
   * @returns Normalized fill information
   */
  getFill(depositInfo: DepositedInfo, toChainId: number): Promise<FillInfo>;

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
