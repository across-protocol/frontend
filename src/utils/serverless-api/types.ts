import { ethers, providers } from "ethers";
import { Fee } from "utils/bridge";
import { ChainId } from "utils/constants";

export type ServerlessAPIEndpoints = {
  suggestedFees: SuggestedApiFeeType;
  prelaunch: {
    rewards: RewardsApiFunction;
    linkedWallet: RetrieveLinkedWalletType;
    connectWallet: ConnectLinkedWalletType;
    discordUserDetails: RetrieveDiscordUserDetailsType;
  };
};

export type RewardsApiFunction =
  | ((
      address: string,
      jwt?: string,
      returnValue?: RewardsApiInterface
    ) => Promise<RewardsApiInterface | null>)
  // temp fix for the prod
  | (() => null);

export interface RewardInterface {
  eligible: boolean;
  completed: boolean;
  amount: string;
}

export interface RewardsApiInterface {
  welcomeTravellerRewards: RewardInterface;
  earlyUserRewards: RewardInterface;
  liquidityProviderRewards: RewardInterface;
  communityRewards?: RewardInterface;
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

export type RetrieveLinkedWalletType = (
  backendJWT: string
) => Promise<string | undefined>;

export type ConnectLinkedWalletType = (
  backendJWT: string,
  discordId: string,
  signer: providers.JsonRpcSigner
) => Promise<boolean>;

export type RetrieveDiscordUserDetailsType = (backendJWT: string) => Promise<{
  discordId: string;
  discordName: string;
  discordAvatar: string;
  walletLinked?: string;
}>;
