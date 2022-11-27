import { ServerlessAPIEndpoints } from "../types";
import { suggestedFeesMockedApiCall } from "./suggested-fees.mocked";
import prelaunchRewardsMockedCall from "./rewards.mocked";
import { retrieveLinkedWalletMockedCall } from "./retrieve-linked-wallet.mocked";
import { connectLinkedWalletMockedCall } from "./connect-linked-wallet.mocked";
import { retrieveDiscordUserDetailsMockedCall } from "./retrieve-user-details.mocked";
import { getDepositStatsMocked } from "./get-deposit-stats.mocked";
import { coingeckoMockedApiCall } from "./coingecko.mocked";

import { retrieveLimitsMocked } from "./bridge-limits.mocked";

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
};
