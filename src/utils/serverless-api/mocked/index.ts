import { ServerlessAPIEndpoints } from "../types";
import { suggestedFeesMockedApiCall } from "./suggested-fees.mocked";
import prelaunchRewardsMockedCall from "./rewards.mocked";
import { retrieveLinkedWalletMockedCall } from "./retrieve-linked-wallet.mocked";
export const mockedEndpoints: ServerlessAPIEndpoints = {
  suggestedFees: suggestedFeesMockedApiCall,
  prelaunch: {
    rewards: prelaunchRewardsMockedCall,
    linkedWallet: retrieveLinkedWalletMockedCall,
  },
};
