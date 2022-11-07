import getApiEndpoint from "utils/serverless-api";
import { mockServerlessAPI } from "utils";

const TEST_JWT = "eyTESTING123";

export default async function getPrelaunchRewards(
  address: string,
  jwt?: string
) {
  return getApiEndpoint().prelaunch.rewards(
    address,
    mockServerlessAPI ? TEST_JWT : jwt
  );
}
