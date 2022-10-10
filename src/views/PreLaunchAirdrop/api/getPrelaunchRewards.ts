import getApiEndpoint from "utils/serverless-api";
import { mockServerlessAPI } from "utils";

const TEST_JWT = "eyTESTING123";

export default async function getPrelaunchRewards(
  address: string,
  jwt?: string
) {
  return getApiEndpoint().prelaunch.rewards(
    address,
    mockServerlessAPI ? TEST_JWT : jwt,
    mockServerlessAPI
      ? {
          welcomeTravellerRewards: {
            eligible: true,
            completed: false,
            amount: "1",
          },
          earlyUserRewards: {
            eligible: true,
            completed: false,
            amount: "2",
          },
          liquidityProviderRewards: {
            eligible: true,
            completed: false,
            amount: "5.123412341242314",
          },
          communityRewards: {
            eligible: true,
            completed: false,
            amount: "10",
          },
        }
      : undefined
  );
}
