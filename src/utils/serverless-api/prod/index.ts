import { ServerlessAPIEndpoints } from "../types";
import { suggestedFeesApiCall } from "./suggested-fees.prod";
export const prodEndpoints: ServerlessAPIEndpoints = {
  suggestedFees: suggestedFeesApiCall,
  prelaunchRewards: () => null,
};
