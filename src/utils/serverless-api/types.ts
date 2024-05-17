import { BigNumber, ethers, providers } from "ethers";
import { Fee } from "utils/bridge";
import { ChainId } from "utils/constants";
import { CoingeckoApiCall } from "./prod/coingecko";
import { PoolsApiCall } from "./prod/pools";
import { SwapQuoteApiCall } from "./prod/swap-quote";
import { PoolsUserApiCall } from "./prod/pools-user";

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
  pools: PoolsApiCall;
  poolsUser: PoolsUserApiCall;
  swapQuote: SwapQuoteApiCall;
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

export type SuggestedApiFeeReturnType = {
  totalRelayFee: Fee;
  relayerGasFee: Fee;
  relayerCapitalFee: Fee;
  lpFee: Fee;
  isAmountTooLow: boolean;
  quoteTimestamp: ethers.BigNumber;
  quoteBlock: ethers.BigNumber;
};

export type SuggestedApiFeeType = (
  amount: ethers.BigNumber,
  inputToken: string,
  outputToken: string,
  toChainid: ChainId,
  fromChainid: ChainId,
  recipientAddress?: string
) => Promise<SuggestedApiFeeReturnType>;

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

export interface BridgeLimitInterface {
  minDeposit: BigNumber;
  maxDeposit: BigNumber;
  maxDepositInstant: BigNumber;
  maxDepositShortDelay: BigNumber;
}

export type BridgeLimitFunction = (
  inputTokenSymbol: string,
  outputTokenSymbol: string,
  fromChainId: string | ChainId,
  toChainId: string | ChainId
) => Promise<BridgeLimitInterface>;
