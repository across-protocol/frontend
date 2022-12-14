/**
 * An enumerated representation of all amplitude events relevant to Across
 */
export enum AmplitudeEvent {
  ApplicationLoaded = "ApplicationLoaded",
  WebVitals = "WebVitals",
  ConnectWalletButtonClicked = "ConnectWalletButtonClicked",
  WalletSelected = "WalletSelected",
  WalletConnectTransactionCompleted = "WalletConnectTransactionCompleted",
  DisconnectWalletButtonClicked = "DisconnectWalletButtonClicked",
  PageViewed = "PageViewed",
  FromChainSelected = "FromChainSelected",
  ToChainSelected = "ToChainSelected",
  TokenSelected = "TokenSelected",
  MaxTokenAmountClicked = "MaxTokenAmountClicked",
  ToAccountChanged = "ToAccountChanged",
  FeesInfoExpanded = "FeesInfoExpanded",
  TransferQuoteRecieved = "TransferQuoteRecieved",
  TransferSubmitted = "TransferSubmitted",
  TransferSigned = "TransferSigned",
  TransferTransactionCompleted = "TransferTransactionCompleted",
}
interface ApplicationLoadedRecordInterface {
  event: AmplitudeEvent.ApplicationLoaded;
}
interface WebVitalsRecordInterface {
  event: AmplitudeEvent.WebVitals;
  payload: {
    cumulativeLayoutShift: number;
  };
}
interface ConnectWalletButtonClickedRecordInterface {
  event: AmplitudeEvent.ConnectWalletButtonClicked;
  payload: {
    action: string;
    page: string;
    section: string;
    element: string;
  };
}
interface WalletSelectedRecordInterface {
  event: AmplitudeEvent.WalletSelected;
  payload: {
    action: string;
    page: string;
    element: string;
    walletType: string;
  };
}
interface WalletConnectTransactionCompletedRecordInterface {
  event: AmplitudeEvent.WalletConnectTransactionCompleted;
  payload: {
    isReconnect: boolean;
    succeeded: boolean;
    walletAddress: string;
    walletType: string;
  };
}
interface DisconnectWalletButtonClickedRecordInterface {
  event: AmplitudeEvent.DisconnectWalletButtonClicked;
  payload: {
    action: string;
    page: string;
    section: string;
    element: string;
  };
}
interface PageViewedRecordInterface {
  event: AmplitudeEvent.PageViewed;
  payload: {
    referrer: string;
    origin: string;
    gitCommitHash: string;
    isInitialPageView: string;
    path: string;
  };
}
interface FromChainSelectedRecordInterface {
  event: AmplitudeEvent.FromChainSelected;
  payload: {
    fromChainId: number;
    chainName: string;
  };
}
interface ToChainSelectedRecordInterface {
  event: AmplitudeEvent.ToChainSelected;
  payload: {
    toChainId: number;
    chainName: string;
  };
}
interface TokenSelectedRecordInterface {
  event: AmplitudeEvent.TokenSelected;
  payload: {
    tokenSymbol: string;
    tokenListIndex: number;
    tokenListLength: number;
  };
}
interface MaxTokenAmountClickedRecordInterface {
  event: AmplitudeEvent.MaxTokenAmountClicked;
  payload: {
    action: string;
    page: string;
    section: string;
    element: string;
  };
}
interface ToAccountChangedRecordInterface {
  event: AmplitudeEvent.ToAccountChanged;
  payload: {
    toWalletAddress: string;
  };
}

type TransferRelatedPayload = {
  tokenSymbol: string;
  fromAmount: string;
  fromAmountUsd: string;
  fromChainId: number;
  fromChainName: string;
  toAmount: string;
  toAmountUsd: string;
  toChainId: number;
  toChainName: string;
  sender: string;
  recipient: string;
  isSenderEqRecipient: boolean;
  capitalFeePct: string;
  capitalFeeTotal: string;
  capitalFeeTotalUsd: string;
  isAmountTooLow: boolean;
  lpFeePct: string;
  lpFeeTotal: string;
  lpFeeTotalUsd: string;
  relayFeePct: string;
  relayFeeTotal: string;
  relayFeeTotalUsd: string;
  relayGasFeePct: string;
  relayGasFeeTotal: string;
  relayGasFeeTotalUsd: string;
  expectedFillTimeInMinutes: number;
  totalBridgeFee: string;
  totalBridgeFeePct: string;
  totalBridgeFeeUsd: string;
  quoteTimestamp: number;
  quoteLatencyMilliseconds: number;
  routeChainIdFromTo: number;
  routeChainNameFromTo: string;
  transferQuoteBlockNumber: number;
};

interface FeesInfoExpandedRecordInterface {
  event: AmplitudeEvent.FeesInfoExpanded;
  payload: TransferRelatedPayload;
}
interface TransferQuoteRecievedRecordInterface {
  event: AmplitudeEvent.TransferQuoteRecieved;
  payload: TransferRelatedPayload;
}
interface TransferSubmittedRecordInterface {
  event: AmplitudeEvent.TransferSubmitted;
  payload: TransferRelatedPayload & {
    transferQuoteBlockNumber: number;
    referralProgramAddress: string;
  };
}
interface TransferSignedRecordInterface {
  event: AmplitudeEvent.TransferSigned;
  payload: TransferRelatedPayload & {
    transactionHash: string;
    timeFromTransferSubmittedToTransferSignedInMilliseconds: number;
    referralProgramAddress: string;
  };
}
interface TransferTransactionCompletedRecordInterface {
  event: AmplitudeEvent.TransferTransactionCompleted;
  payload: TransferRelatedPayload & {
    transactionHash: string;
    timeFromTransferSubmittedToTransferSignedInMilliseconds: number;
    referralProgramAddress: string;
    transferCompleteTimestamp: number;
    NetworkFeeNative: string;
    NetworkFeeNativeToken: string;
    NetworkFeeUsd: string;
  };
}

export type AmplitudeEventLogRecord =
  | ApplicationLoadedRecordInterface
  | WebVitalsRecordInterface
  | ConnectWalletButtonClickedRecordInterface
  | WalletSelectedRecordInterface
  | WalletConnectTransactionCompletedRecordInterface
  | DisconnectWalletButtonClickedRecordInterface
  | PageViewedRecordInterface
  | FromChainSelectedRecordInterface
  | ToChainSelectedRecordInterface
  | TokenSelectedRecordInterface
  | MaxTokenAmountClickedRecordInterface
  | ToAccountChangedRecordInterface
  | FeesInfoExpandedRecordInterface
  | TransferQuoteRecievedRecordInterface
  | TransferSubmittedRecordInterface
  | TransferSignedRecordInterface
  | TransferTransactionCompletedRecordInterface;
