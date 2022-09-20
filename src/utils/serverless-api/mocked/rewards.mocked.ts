import { ethers } from "ethers";
import mockAdapter, { axios } from "../mock-adapter";
/**
 * Creates a mocked variant of the rewards API Call
 * @param _amount The amount of fees to calculate
 * @header (optional) HTTP header - Authorization: Bearer <JWT_TOKEN>
 * @returns The result of the HTTP call to `api/suggested-fees`
 */

export interface RewardsApiInterface {
  welcomeTravellerRewards: string;
  earlyUserRewards: string;
  liquidityProviderRewards: string;
  communityRewards?: string;
}
export default async function prelaunchRewardsMockedCall(
  _address: string,
  _jwt?: string
): Promise<RewardsApiInterface> {
  mockAdapter
    .onGet("/rewards", {
      headers: {
        Authorization: `Bearer ${_jwt}`,
      },
    })
    .reply(200, {
      welcomeTravellerRewards: ethers.BigNumber.from("1").toString(),
      earlyUserRewards: ethers.BigNumber.from("2").toString(),
      liquidityProviderRewards: ethers.BigNumber.from("5").toString(),
      communityRewards: _jwt
        ? ethers.BigNumber.from("10").toString()
        : ethers.BigNumber.from("0").toString(),
    });

  return axios.get(`/rewards`).then((res) => {
    return res.data;
  });
}
