import { mockServerlessAPI } from "utils/constants";
import { mockedEndpoints } from "./mocked";
import { prodEndpoints } from "./prod";
import { ServerlessAPIEndpoints } from "./types";

export default function getApiEndpoint(): ServerlessAPIEndpoints {
  if (mockServerlessAPI) {
    return mockedEndpoints;
  } else {
    return prodEndpoints;
  }
}
