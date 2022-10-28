import { ServerlessAPIEndpoints } from "../types";
import { connectLinkedWallet } from "./connect-linked-wallet.prod";
import { retrieveDiscordUserDetails } from "./retrieve-discord-user-details.prod";
import { retrieveLinkedWallet } from "./retrieve-linked-wallet.prod";
import { suggestedFeesApiCall } from "./suggested-fees.prod";
import rewardsApiCall from "./rewards";
import { getDepositStats } from "./get-deposit-stats.prod";

export const prodEndpoints: ServerlessAPIEndpoints = {
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
