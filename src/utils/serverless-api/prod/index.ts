import { ServerlessAPIEndpoints } from "../types";
import { connectLinkedWallet } from "./connect-linked-wallet.prod";
import { retrieveDiscordUserDetails } from "./retrieve-discord-user-details.prod";
import { retrieveLinkedWallet } from "./retrieve-linked-wallet.prod";
import { suggestedFeesApiCall } from "./suggested-fees.prod";
import rewardsApiCall from "./rewards";
import { getDepositStats } from "./get-deposit-stats.prod";
import { coingeckoApiCall } from "./coingecko";
import { retrieveLimits } from "./retrieveLimits";
import { poolsApiCall } from "./pools";
import { swapQuoteApiCall } from "./swap-quote";
import { poolsUserApiCall } from "./pools-user";

export const prodEndpoints: ServerlessAPIEndpoints = {
  coingecko: coingeckoApiCall,
  suggestedFees: suggestedFeesApiCall,
  limits: retrieveLimits,
  prelaunch: {
    rewards: rewardsApiCall,
    linkedWallet: retrieveLinkedWallet,
    connectWallet: connectLinkedWallet,
    discordUserDetails: retrieveDiscordUserDetails,
  },
  splash: {
    getStats: getDepositStats,
  },
  pools: poolsApiCall,
  poolsUser: poolsUserApiCall,
  swapQuote: swapQuoteApiCall,
};
