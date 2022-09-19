import { mockServerlessAPI } from "utils/constants";
import { mockedEndpoints } from "./mocked";
import { prodEndpoints } from "./prod";
import { ServerlessAPIEndpoints } from "./types";

/**
 * Returns a set of functions used to interface with Across' serverless API
 * @returns A set of mocked or production-ready functions depending on the `REACT_APP_MOCK_SERVERLESS` env variable.
 */
export default function getApiEndpoint(): ServerlessAPIEndpoints {
  if (mockServerlessAPI) {
    return mockedEndpoints;
  } else {
    return prodEndpoints;
  }
}
