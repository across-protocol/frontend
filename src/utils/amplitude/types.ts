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
}
interface ConnectWalletButtonClickedRecordInterface {
  event: AmplitudeEvent.ConnectWalletButtonClicked;
}
interface WalletSelectedRecordInterface {
  event: AmplitudeEvent.WalletSelected;
}
interface WalletConnectTransactionCompletedRecordInterface {
  event: AmplitudeEvent.WalletConnectTransactionCompleted;
}
interface DisconnectWalletButtonClickedRecordInterface {
  event: AmplitudeEvent.DisconnectWalletButtonClicked;
}
interface PageViewedRecordInterface {
  event: AmplitudeEvent.PageViewed;
}
interface FromChainSelectedRecordInterface {
  event: AmplitudeEvent.FromChainSelected;
}
interface ToChainSelectedRecordInterface {
  event: AmplitudeEvent.ToChainSelected;
}
interface TokenSelectedRecordInterface {
  event: AmplitudeEvent.TokenSelected;
}
interface MaxTokenAmountClickedRecordInterface {
  event: AmplitudeEvent.MaxTokenAmountClicked;
}
interface ToAccountChangedRecordInterface {
  event: AmplitudeEvent.ToAccountChanged;
}
interface FeesInfoExpandedRecordInterface {
  event: AmplitudeEvent.FeesInfoExpanded;
}
interface TransferQuoteRecievedRecordInterface {
  event: AmplitudeEvent.TransferQuoteRecieved;
}
interface TransferSubmittedRecordInterface {
  event: AmplitudeEvent.TransferSubmitted;
}
interface TransferSignedRecordInterface {
  event: AmplitudeEvent.TransferSigned;
}
interface TransferTransactionCompletedRecordInterface {
  event: AmplitudeEvent.TransferTransactionCompleted;
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
