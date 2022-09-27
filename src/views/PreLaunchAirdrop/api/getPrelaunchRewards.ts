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
            walletEligible: true,
            completed: false,
            payout: "1",
          },
          earlyUserRewards: {
            walletEligible: true,
            completed: false,
            payout: "2",
          },
          liquidityProviderRewards: {
            walletEligible: true,
            completed: false,
            payout: "5.123412341242314",
          },
          communityRewards: {
            walletEligible: true,
            completed: false,
            payout: "10",
          },
        }
      : undefined
  );
}
