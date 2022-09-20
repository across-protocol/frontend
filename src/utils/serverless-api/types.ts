import { ethers } from "ethers";
import { Fee } from "utils/bridge";
import { ChainId } from "utils/constants";

export type ServerlessAPIEndpoints = {
  suggestedFees: SuggestedApiFeeType;
  prelaunchRewards: RewardsApiFunction;
};

export type RewardsApiFunction =
  | ((address: string, jwt: string) => Promise<RewardsApiInterface>)
  // temp fix for the prod
  | (() => null);

export interface RewardsApiInterface {
  welcomeTravellerRewards: string;
  earlyUserRewards: string;
  liquidityProviderRewards: string;
  communityRewards?: string;
}

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
