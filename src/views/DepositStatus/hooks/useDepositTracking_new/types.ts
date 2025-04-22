import {
  FundsDepositedEvent,
  V3FundsDepositedEvent,
  FilledRelayEvent,
  FilledV3RelayEvent,
} from "@across-protocol/contracts/dist/typechain/contracts/SpokePool";
import { Deposit } from "hooks/useDeposits";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";

export type DepositLog = FundsDepositedEvent | V3FundsDepositedEvent;
export type FillLog = FilledRelayEvent | FilledV3RelayEvent;

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
      depositLog: DepositLog;
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
      fillLog: FillLog;
    };

export type FilledInfo = Extract<
  FillInfo,
  { status: "filled" | "fill-reverted" }
>;

/**
 * Deposit status information
 */
export type DepositStatus = {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  timestamp?: number;
};

/**
 * Fill status information
 */
export type FillStatus = {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  timestamp?: number;
};

/**
 * Base type for chain strategies
 */
export type IChainStrategy = {
  /**
   * Get deposit information from a transaction
   * @param txIdOrSignature Transaction hash or signature
   * @returns Deposit information
   */
  getDeposit(txIdOrSignature: string): Promise<DepositInfo>;

  /**
   * Get fill information for a deposit
   * @param depositInfo Deposit information
   * @param toChainId Destination chain ID
   * @returns Fill information
   */
  getFill(depositInfo: DepositInfo, toChainId: number): Promise<FillInfo>;

  /**
   * Convert fill information to local storage format for deposits
   * @param data Deposit transaction and log information
   * @param fromBridgePagePayload Bridge page payload containing route and quote details
   * @returns Local deposit format for storage
   */
  convertForDepositQuery(
    depositInfo: DepositInfo,
    fromBridgePagePayload: FromBridgePagePayload
  ): Deposit;
  /**
   * Convert fill information to local storage format
   * @param fillInfo Fill information
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
};
