import { ServerlessAPIEndpoints } from "../types";
import { connectLinkedWallet } from "./connect-linked-wallet.prod";
import { retrieveDiscordUserDetails } from "./retrieve-discord-user-details.prod";
import { retrieveLinkedWallet } from "./retrieve-linked-wallet.prod";
import { suggestedFeesApiCall } from "./suggested-fees.prod";
export const prodEndpoints: ServerlessAPIEndpoints = {
  suggestedFees: suggestedFeesApiCall,
  prelaunch: {
    rewards: () => null,
    linkedWallet: retrieveLinkedWallet,
    connectWallet: connectLinkedWallet,
    discordUserDetails: retrieveDiscordUserDetails,
  },
};
