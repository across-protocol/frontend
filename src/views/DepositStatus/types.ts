export type DepositStatus =
  | "deposit-reverted"
  | "depositing"
  | "filling"
  | "filled";

import { SwapQuoteApiResponse } from "utils/serverless-api/prod/swap-quote";
import { GetBridgeFeesResult } from "utils/bridge";
import { UniversalSwapQuote } from "hooks/useUniversalSwapQuote";
import { BridgeLimitInterface } from "utils/serverless-api/types";
import { TransferQuoteReceivedProperties } from "ampli";
import { Route, SwapRoute, UniversalSwapRoute } from "utils";

export type SelectedRoute =
  | (Route & {
      type: "bridge";
    })
  | (SwapRoute & {
      type: "swap";
    })
  | (UniversalSwapRoute & {
      type: "universal-swap";
    });

export type FromBridgePagePayload = {
  expectedFillTime: string;
  timeSigned: number;
  recipient: string;
  referrer: string;
  tokenPrice: string;
  swapQuote?: SwapQuoteApiResponse;
  universalSwapQuote?: UniversalSwapQuote;
  selectedRoute: SelectedRoute;
  quote: GetBridgeFeesResult;
  quotedLimits: BridgeLimitInterface;
  quoteForAnalytics: TransferQuoteReceivedProperties;
  depositArgs: {
    amount: string;
    initialAmount?: string;
    recipient: string;
    destinationChainId: number;
    originChainId: number;
    depositId?: string;
    inputToken: string;
    outputToken: string;
    relayerFeePct: string;
    quoteTimestamp: number;
    fillDeadline: number;
    exclusivityDeadline: number;
    message?: string;
    maxCount?: string;
  };
};
