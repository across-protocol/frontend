import { BigNumber, ethers, providers } from "ethers";
import { Fee } from "utils/bridge";
import { ChainId } from "utils/constants";
import { CoingeckoApiCall } from "./prod/coingecko";

export type ServerlessAPIEndpoints = {
  coingecko: CoingeckoApiCall;
  suggestedFees: SuggestedApiFeeType;
  limits: BridgeLimitFunction;
  prelaunch: {
    rewards: RewardsApiFunction;
    linkedWallet: RetrieveLinkedWalletType;
    connectWallet: ConnectLinkedWalletType;
    discordUserDetails: RetrieveDiscordUserDetailsType;
  };
  splash: {
    getStats: GetDepositStatsType;
  };
};

export interface BridgeLimitInterface {
  minDeposit: BigNumber;
  maxDeposit: BigNumber;
  maxDepositInstant: BigNumber;
  maxDepositShortDelay: BigNumber;
}

export type BridgeLimitFunction = (
  token: string | ChainId,
  fromChainId: string | ChainId,
  toChainId: string | ChainId
) => Promise<BridgeLimitInterface>;

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
  toChainid: ChainId,
  fromChainid: ChainId
) => Promise<{
  relayerFee: Fee;
  relayerGasFee: Fee;
  relayerCapitalFee: Fee;
  isAmountTooLow: boolean;
  quoteTimestamp?: ethers.BigNumber;
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

export interface GetDepositStatsInterface {
  totalDeposits: number;
  avgFillTime: number;
  totalVolumeUsd: number;
}

export type GetDepositStatsType = () => Promise<GetDepositStatsInterface>;
