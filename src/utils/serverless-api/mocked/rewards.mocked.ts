import { ethers } from "ethers";
import mockAdapter, { axios } from "../mock-adapter";
import { RewardsApiInterface, RewardInterface } from "../types";
/**
 * Creates a mocked variant of the rewards API Call
 * @param _amount The amount of fees to calculate
 * @header (optional) HTTP header - Authorization: Bearer <JWT_TOKEN>
 * @returns The result of the HTTP call to `api/suggested-fees`
 */

export default async function prelaunchRewardsMockedCall(
  _address: string,
  _jwt?: string,
  _returnValue?: RewardInterface
): Promise<RewardsApiInterface> {
  const rv = _returnValue || {
    welcomeTravellerRewards: {
      walletEligible: false,
      completed: false,
      payout: ethers.BigNumber.from("1").toString(),
    },
    earlyUserRewards: {
      walletEligible: false,
      completed: false,
      payout: ethers.BigNumber.from("2").toString(),
    },
    liquidityProviderRewards: {
      walletEligible: false,
      completed: false,
      payout: ethers.BigNumber.from("5").toString(),
    },
    communityRewards: _jwt
      ? {
          walletEligible: false,
          completed: false,
          payout: ethers.BigNumber.from("10").toString(),
        }
      : {
          walletEligible: false,
          completed: false,
          payout: ethers.BigNumber.from("0").toString(),
        },
  };
  mockAdapter
    .onGet("/rewards", {
      headers: {
        Authorization: `Bearer ${_jwt}`,
      },
    })
    .reply(200, rv);

  return axios.get(`/rewards`).then((res) => {
    return res.data;
  });
}
