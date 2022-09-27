import getApiEndpoint from "utils/serverless-api";
import { mockServerlessAPI } from "utils";

const TEST_JWT =
  "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..IFJ1oL_VAa-nnhEX.HmM1L9g8uBlrSggZeQr8f-cpIslh8rTnVe1HVXxf0Kgkm6GO-TmdDxokln4vG1udByCTgTAOvTAWVDcvyJy4L_tTxSLwhoaEBIYnN_G3lZXg4JYen7__7qqdI2oZOLTJ0iSVGoL4Ro_TvWe_ZPLTLugx-Figkr20pabxUorw7yw8mqWCLDuWR56ZpH94RUGN5CjRTs0z1FXPac0TKo_Q-gtLcmnpwj383A.ZYkHwm56_n5GHvB-7y6Tag";
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
