import { ethers } from "ethers";
import { Fee } from "utils/bridge";
import { ChainId } from "utils/constants";

export type ServerlessAPIEndpoints = {
  suggestedFees: SuggestedApiFeeType;
};

export type SuggestedApiFeeType = (
  amount: ethers.BigNumber,
  originToken: string,
  toChainid: ChainId
) => Promise<{
  relayerFee: Fee;
  relayerGasFee: Fee;
  relayerCapitalFee: Fee;
  isAmountTooLow: boolean;
}>;
