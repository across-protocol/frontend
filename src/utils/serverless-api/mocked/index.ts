import { ServerlessAPIEndpoints } from "../types";
import { suggestedFeesMockedApiCall } from "./suggested-fees.mocked";
import prelaunchRewardsMockedCall from "./rewards.mocked";
import { retrieveLinkedWalletMockedCall } from "./retrieve-linked-wallet.mocked";
import { connectLinkedWalletMockedCall } from "./connect-linked-wallet.mocked";
import { retrieveDiscordUserDetailsMockedCall } from "./retrieve-user-details.mocked";
import { getDepositStatsMocked } from "./get-deposit-stats.mocked";
import { coingeckoMockedApiCall } from "./coingecko.mocked";
import { retrieveLimitsMocked } from "./bridge-limits.mocked";
import { poolsApiCall } from "./pools.mocked";
import { swapQuoteApiCall } from "./swap-quote";
import { poolsUserApiCall } from "./pools-user.mocked";
import { swapApprovalApiCall } from "../prod/swap-approval";
import { swapChainsApiCall } from "../prod/swap-chains";
import { swapTokensApiCall } from "../prod/swap-tokens";
import { userTokenBalancesMockedApiCall } from "./user-token-balances.mocked";

export const mockedEndpoints: ServerlessAPIEndpoints = {
  coingecko: coingeckoMockedApiCall,
  suggestedFees: suggestedFeesMockedApiCall,
  limits: retrieveLimitsMocked,
  prelaunch: {
    rewards: prelaunchRewardsMockedCall,
    linkedWallet: retrieveLinkedWalletMockedCall,
    connectWallet: connectLinkedWalletMockedCall,
    discordUserDetails: retrieveDiscordUserDetailsMockedCall,
  },
  splash: {
    getStats: getDepositStatsMocked,
  },
  pools: poolsApiCall,
  poolsUser: poolsUserApiCall,
  swapQuote: swapQuoteApiCall,
  swapApproval: swapApprovalApiCall,
  swapChains: swapChainsApiCall,
  swapTokens: swapTokensApiCall,
  userTokenBalances: userTokenBalancesMockedApiCall,
};
