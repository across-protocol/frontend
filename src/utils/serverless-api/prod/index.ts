import { ServerlessAPIEndpoints } from "../types";
import { retrieveLinkedWallet } from "./retrieve-linked-wallet.prod";
import { suggestedFeesApiCall } from "./suggested-fees.prod";
export const prodEndpoints: ServerlessAPIEndpoints = {
  suggestedFees: suggestedFeesApiCall,
  prelaunch: {
    rewards: () => null,
    linkedWallet: retrieveLinkedWallet,
  },
};
