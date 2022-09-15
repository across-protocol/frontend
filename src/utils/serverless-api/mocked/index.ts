import { ServerlessAPIEndpoints } from "../types";
import { suggestedFeesMockedApiCall } from "./suggested-fees.mocked";

export const mockedEndpoints: ServerlessAPIEndpoints = {
  suggestedFees: suggestedFeesMockedApiCall,
};
