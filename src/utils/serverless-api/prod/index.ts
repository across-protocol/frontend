import { ServerlessAPIEndpoints } from "../types";
import { connectLinkedWallet } from "./connect-linked-wallet.prod";
import { retrieveDiscordUserDetails } from "./retrieve-discord-user-details.prod";
import { retrieveLinkedWallet } from "./retrieve-linked-wallet.prod";
import { suggestedFeesApiCall } from "./suggested-fees.prod";
import rewardsApiCall from "./rewards";
import { getDepositStats } from "./get-deposit-stats.prod";
import { coingeckoApiCall } from "./coingecko";

export const prodEndpoints: ServerlessAPIEndpoints = {
  coingecko: coingeckoApiCall,
  suggestedFees: suggestedFeesApiCall,
  prelaunch: {
    rewards: rewardsApiCall,
    linkedWallet: retrieveLinkedWallet,
    connectWallet: connectLinkedWallet,
    discordUserDetails: retrieveDiscordUserDetails,
  },
  splash: {
    getStats: getDepositStats,
  },
};
