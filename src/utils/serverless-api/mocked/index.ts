import { ServerlessAPIEndpoints } from "../types";
import { suggestedFeesMockedApiCall } from "./suggested-fees.mocked";
import prelaunchRewardsMockedCall from "./rewards.mocked";
export const mockedEndpoints: ServerlessAPIEndpoints = {
  suggestedFees: suggestedFeesMockedApiCall,
  prelaunchRewards: prelaunchRewardsMockedCall,
};
