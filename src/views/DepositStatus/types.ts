import { BigNumber } from "ethers";

import { TransferQuoteReceivedProperties } from "ampli";
import { AcrossDepositArgs } from "utils";

export type DepositStatus = "depositing" | "filling" | "filled";

export type FromBridgePagePayload = {
  sendDepositArgs: AcrossDepositArgs;
  quote: TransferQuoteReceivedProperties;
  referrer: string;
  account: string;
  timeSigned: number;
  tokenPrice: BigNumber;
};
